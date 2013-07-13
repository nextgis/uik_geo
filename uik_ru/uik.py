# -*- coding: utf-8 -*-
__author__ = 'karavanjo'

from models import *
from helpers import *
from decorators import authorized
from pyramid.view import view_config
from pyramid.response import Response
from sqlalchemy import func
from sqlalchemy.sql.expression import asc
from geoalchemy import WKTSpatialElement, functions
import transaction

import json


@view_config(route_name='uiks', request_method='GET')
def get_all(context, request):
    page_size = 50
    is_filter_applied = False
    filter = json.loads(request.GET['filter'])
    clauses = []
    if filter['uik']:
        filter['uik']['address'] = filter['uik']['address'].encode('UTF-8').strip()
        filter['uik']['number'] = filter['uik']['number'].encode('UTF-8').strip()
        if filter['uik']['address'] or filter['uik']['number']:
            is_filter_applied = True
            if filter['uik']['address'].__len__() > 3:
                address = '%' + filter['uik']['address'] + '%'
                clauses.append(Uik.address_voting.ilike(address))
            if filter['uik']['number']:
                number = '%' + filter['uik']['number'] + '%'
                clauses.append(Uik.number_composite.ilike(number))

    bbox = json.loads(request.params.getall('bbox')[0])
    box_geom = leaflet_bbox_to_polygon(bbox)

    uiks_for_json = {'points': {
        'count': 0,
        'layers': {
            'checked': {'elements': [], 'count': 0},
            'unchecked': {'elements': [], 'count': 0},
            'blocked': {'elements': [], 'count': 0}
        }}}

    session = DBSession()
    if is_filter_applied:
        contains = functions.gcontains(box_geom, Uik.point).label('contains')
        uiks_from_db = session.query(Uik, Uik.point.x, Uik.point.y) \
            .filter(*clauses) \
            .order_by(contains.desc()) \
            .limit(page_size) \
            .all()
        if len(uiks_from_db) < page_size:
            uiks_for_json['points']['count'] = len(uiks_from_db)
        else:
            uiks_for_json['points']['count'] = session.query(Uik.id) \
                .filter(*clauses) \
                .count()
    else:
        uiks_from_db = session.query(Uik, Uik.point.x, Uik.point.y) \
            .filter(Uik.point.within(box_geom)) \
            .all()
        uiks_for_json['points']['count'] = len(uiks_from_db)

    for uik in uiks_from_db:
        if uik[0].is_blocked:
            uiks_for_json['points']['layers']['blocked']['elements'].append(_get_uik_from_uik_db(uik))
            continue
        if uik[0].is_applied:
            uiks_for_json['points']['layers']['checked']['elements'].append(_get_uik_from_uik_db(uik))
            continue
        uiks_for_json['points']['layers']['unchecked']['elements'].append(_get_uik_from_uik_db(uik))

    uiks_for_json['points']['layers']['blocked']['count'] = len(uiks_for_json['points']['layers']['blocked']['elements'])
    uiks_for_json['points']['layers']['checked']['count'] = len(uiks_for_json['points']['layers']['checked']['elements'])
    uiks_for_json['points']['layers']['unchecked']['count'] = len(uiks_for_json['points']['layers']['unchecked']['elements'])

    uiks_result = {'data': uiks_for_json}

    return Response(json.dumps(uiks_result), content_type='application/json')


def _get_uik_from_uik_db(uik_from_db):
    return {
        'id': uik_from_db[0].id,
        'name': uik_from_db[0].number_official,
        'addr': uik_from_db[0].address_voting,
        'lon': uik_from_db[1],
        'lat': uik_from_db[2]
    }

@view_config(route_name='uik', request_method='GET')
def get_uik(context, request):
    id = request.matchdict.get('id', None)
    session = DBSession()
    uik = session.query(Uik, Uik.point.x, Uik.point.y, GeocodingPrecision, Region, Tik, User) \
        .outerjoin((GeocodingPrecision, Uik.geocoding_precision_id == GeocodingPrecision.id)) \
        .outerjoin((Region, Uik.region_id == Region.id)) \
        .outerjoin((Tik, Uik.tik_id == Tik.id)) \
        .outerjoin((User, Uik.user_block_id == User.id)) \
        .filter(Uik.id == id).one()

    versions = session.query(UikVersions, UikVersions.uik_id, UikVersions.user_id, UikVersions.time) \
        .filter(UikVersions.uik_id == id).order_by(UikVersions.time).all()

    uik_res = {
        'uik': uik[0].to_dict(),
        'geo_precision': uik[3].to_dict(),
        'region': uik[4].to_dict(),
        'tik': uik[5].to_dict(),
        'versions': [version.to_dict_without_dump() for version in versions]
    }

    uik_res['uik']['geom'] = {'lng': uik[1], 'lat': uik[2]}

    uik_res['uik']['user_blocked'] = ''
    uik_res['uik']['is_blocked'] = False
    if uik[0].is_blocked:
        uik_res['uik']['is_blocked'] = True
        uik_res['uik']['user_blocked'] = uik[0].user_block.display_name

    uik_res['uik']['is_unblocked'] = ''
    if 'u_id' in request.session and uik[0].is_blocked and \
        request.session['u_id'] == uik[0].user_block.id:
        uik_res['uik']['is_unblocked'] = True

    return Response(json.dumps(uik_res), content_type='application/json')


@view_config(route_name='uik', request_method='POST')
@authorized()
def update_uik(context, request):
    uik = json.loads(request.POST['uik'])
    session = DBSession()
    from helpers import str_to_boolean
    session.query(Uik).filter(Uik.id == uik['id']).update({
        Uik.address_voting: uik['address_voting'],
        Uik.place_voting: uik['place_voting'],
        Uik.is_applied: str_to_boolean(uik['is_applied']),
        Uik.comment: uik['comment'],
        Uik.geocoding_precision_id: uik['geo_precision'],
        Uik.is_blocked: False,
        Uik.user_block_id: None
    }, synchronize_session=False)
    sql = 'UPDATE uiks SET point=ST_GeomFromText(:wkt, 4326) WHERE id = :uik_id'
    session.execute(sql, {
        'wkt': 'POINT(%s %s)' % (uik['geom']['lng'], uik['geom']['lat']),
        'uik_id': uik['id']
    })

    log = UikVersions()
    log.uik_id = uik['id']
    log.user_id = request.session['u_id']
    from datetime import datetime
    log.time = datetime.now()
    log.dump = log.to_json_binary_dump(uik)
    session.add(log)

    transaction.commit()
    return Response()

@view_config(route_name='uik_block', request_method='GET')
@authorized()
def uik_block(context, request):
    id = request.matchdict.get('id', None)
    session = DBSession()
    session.query(Uik).filter(Uik.id == id).update({
        Uik.is_blocked: True,
        Uik.user_block_id: request.session['u_id']
    })
    transaction.commit()
    return Response()


@view_config(route_name='uik_unblock', request_method='GET')
@authorized()
def uik_unblock(context, request):
    id = request.matchdict.get('id', None)
    session = DBSession()
    session.query(Uik).filter(Uik.id == id).update({
        Uik.is_blocked: False,
        Uik.user_block_id: None
    })
    transaction.commit()
    return Response()

@view_config(route_name='logs', request_method='GET')
@authorized()
def get_logs(context, request):
    session = DBSession()
    user_uiks_count_sbq = session \
        .query(UikVersions.user_id.label('user_id'), func.count(UikVersions.uik_id.distinct()).label('count_uiks')) \
        .group_by(UikVersions.user_id) \
        .subquery()

    from sqlalchemy.sql.expression import asc
    user_uiks_logs = session.query(User, user_uiks_count_sbq.c.count_uiks) \
        .outerjoin(user_uiks_count_sbq, User.id == user_uiks_count_sbq.c.user_id) \
        .order_by(asc(User.display_name))

    count_editable_stops = session.query(func.count(UikVersions.uik_id.distinct())).scalar()
    count_all_stops = session.query(func.count(Uik.id)).scalar()
    results = {'count': {'all': count_all_stops, 'editable': count_editable_stops},
               'uiks_by_users': []}
    for user_uiks_log in user_uiks_logs:
        results['uiks_by_users'].append({'user_name': user_uiks_log[0].display_name, 'count_uiks': user_uiks_log[1]})
    return Response(json.dumps(results), content_type='application/json')


@view_config(route_name='uikp_all', request_method='GET')
def get_president_uiks(context, request):
    page_size = 100
    is_filter_applied = False
    filter = json.loads(request.GET['filter'])
    clauses = []
    if 'filter' in request.GET:
        filter['uik_2012']['address'] = filter['uik_2012']['address'].encode('UTF-8').strip()
        filter['uik_2012']['number'] = filter['uik_2012']['number'].encode('UTF-8').strip()
        if filter['uik_2012']['address'] or filter['uik_2012']['number']:
            is_filter_applied = True
            if filter['uik_2012']['address'].__len__() > 3:
                address = '%' + filter['uik_2012']['address'] + '%'
                clauses.append(VotingStation.address.ilike(address))
            if filter['uik_2012']['number']:
                number = '%' + filter['uik']['number'] + '%'
                clauses.append(VotingStation.name.ilike(number))

    bbox = json.loads(request.params.getall('bbox')[0])
    box_geom = leaflet_bbox_to_polygon(bbox)

    uiks_for_json = {'points': {
        'count': 0,
        'layers': {
            'uik_2012': {'elements': [], 'count': 0}
        }}}

    session = DBSession()
    if is_filter_applied:
        contains = functions.gcontains(box_geom, Location.point).label('contains')
        uiks_from_db = session.query(VotingStation, Location.point.x, Location.point.y) \
            .join(VotingStation.location) \
            .filter(*clauses) \
            .order_by(contains.desc()) \
            .limit(page_size) \
            .all()
        if len(uiks_from_db) < page_size:
            uiks_for_json['points']['count'] = len(uiks_from_db)
        else:
            uiks_for_json['points']['count'] = session.query(VotingStation.id) \
                .filter(*clauses) \
                .count()
    else:
        uiks_from_db = session.query(VotingStation, Location.point.x, Location.point.y) \
            .join(VotingStation.location) \
            .filter(Location.point.within(box_geom)) \
            .all()
        uiks_for_json['points']['count'] = len(uiks_from_db)

    for uik in uiks_from_db:
        uiks_for_json['points']['layers']['uik_2012']['elements'].append(_get_uik2012_from_uik_db(uik))
        uiks_for_json['points']['layers']['uik_2012']['count'] = uiks_for_json['points']['count']

    return Response(json.dumps(uiks_for_json), content_type='application/json')


def _get_uik2012_from_uik_db(uik_from_db):
    return {'id': uik_from_db[0].id,
            'name': uik_from_db[0].name,
            'addr': uik_from_db[0].address,
            'lon': uik_from_db[1],
            'lat': uik_from_db[2]}

@view_config(route_name='uikp', request_method='GET')
def get_uik2012(context, request):
    id = request.matchdict.get('id', None)
    session = DBSession()
    uik = session.query(VotingStation, Location, Location.point.x, Location.point.y) \
        .join(VotingStation.location) \
        .filter(VotingStation.id == id).one()

    uik_res = {
        'uikp': {
            'id': uik[0].id,
            'name': uik[0].name if uik[0].name else'',
            'comment': uik[0].comment if uik[0].comment else '',
            'address': uik[0].address if uik[0].address else ''
        }
    }

    uik_res['uikp']['geom'] = {'id': uik[1].id, 'lng': uik[2], 'lat': uik[3]}

    return Response(json.dumps(uik_res), content_type='application/json')


@view_config(route_name='stat', request_method='GET')
def get_stat(context, request):
    user_name = None
    if hasattr(request, 'cookies') and 'sk' in request.cookies.keys() and 'sk' in request.session and \
                    request.session['sk'] == request.cookies['sk'] and 'u_name' in request.session:
        user_name = request.session['u_name']

    session = DBSession()
    geocoding_precisions = session.query(GeocodingPrecision).order_by(asc(GeocodingPrecision.id)).all()
    regions = session.query(Region).order_by(asc(Region.name)).all()
    tiks = session.query(Tik).order_by(asc(Tik.name)).all()

    return {
        'u_name': user_name,
        'project': 'uik_ru',
        'geocoding_precisions': geocoding_precisions,
        'regions': regions,
        'tiks': tiks
    }