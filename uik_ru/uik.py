# -*- coding: utf-8 -*-
__author__ = 'karavanjo'

from models import *
from helpers import *
from decorators import authorized
from pyramid.view import view_config
from pyramid.response import Response
from sqlalchemy import func
from geoalchemy import WKTSpatialElement, functions
import transaction

import json


@view_config(route_name='uiks', request_method='GET')
def get_all(context, request):
    page_size = 100
    is_filter_applied = False
    filter = json.loads(request.GET['filter'])
    clauses = []
    if 'filter' in request.GET:
        filter['addr'] = filter['addr'].encode('UTF-8').strip()
        filter['name'] = filter['name'].encode('UTF-8').strip()
        if filter['addr'] or filter['name']:
            is_filter_applied = True
            if filter['addr'].__len__() > 3:
                address = '%' + filter['addr'] + '%'
                clauses.append(Uik.address_voting.ilike(address))
            if filter['name']:
                name = filter['name']
                clauses.append(Uik.number_composite == name)

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

    return Response(json.dumps(uiks_result))


def _get_uik_from_uik_db(uik_from_db):
    return {'id': uik_from_db[0].id,
            'name': uik_from_db[0].number_composite,
            'addr': uik_from_db[0].address_voting,
            'lon': uik_from_db[1],
            'lat': uik_from_db[2]}

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

    uik_res = {
        'uik': uik[0].to_dict(),
        'geo_precision': uik[3].to_dict(),
        'region': uik[4].to_dict(),
        'tik': uik[5].to_dict()
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

    return Response(json.dumps(uik_res))


@view_config(route_name='uik', request_method='POST')
@authorized()
def update_uik(context, request):
    uik = json.loads(request.POST['uik'])
    session = DBSession()
    from helpers import str_to_boolean
    session.query(VotingStation).filter(VotingStation.id == uik['id']).update({
        VotingStation.name: uik['name'],
        VotingStation.comment: uik['comment'],
        VotingStation.address: uik['address'],
        VotingStation.is_checked: str_to_boolean(uik['is_checked']),
        VotingStation.is_blocked: False,
        VotingStation.user_block_id: None
    }, synchronize_session=False)
    sql = 'UPDATE location SET point=ST_GeomFromText(:wkt, 4326) WHERE id = :location_id'
    session.execute(sql, {
        'wkt': 'POINT(%s %s)' % (uik['geom']['lng'], uik['geom']['lat']),
        'location_id': uik['geom']['id']
    })

    log = UikVersions()
    log.voting_station_id = uik['id']
    log.user_id = request.session['u_id']
    from datetime import datetime
    log.time = datetime.now()
    session.add(log)

    transaction.commit()
    return Response()

@view_config(route_name='uik_block', request_method='GET')
@authorized()
def uik_block(context, request):
    id = request.matchdict.get('id', None)
    session = DBSession()
    session.query(VotingStation).filter(VotingStation.id == id).update({
        VotingStation.is_blocked: True,
        VotingStation.user_block_id: request.session['u_id']
    })
    transaction.commit()
    return Response()


@view_config(route_name='uik_unblock', request_method='GET')
@authorized()
def uik_unblock(context, request):
    id = request.matchdict.get('id', None)
    session = DBSession()
    session.query(VotingStation).filter(VotingStation.id == id).update({
        VotingStation.is_blocked: False,
        VotingStation.user_block_id: None
    })
    transaction.commit()
    return Response()

@view_config(route_name='logs', request_method='GET')
@authorized()
def get_logs(context, request):
    session = DBSession()
    user_stops_count_sbq = session \
        .query(LogSavings.user_id.label('user_id'), func.count(LogSavings.voting_station_id.distinct()).label('count_stops')) \
        .group_by(LogSavings.user_id) \
        .subquery()

    from sqlalchemy.sql.expression import asc
    user_stops_log = session.query(User, user_stops_count_sbq.c.count_stops) \
        .outerjoin(user_stops_count_sbq, User.id == user_stops_count_sbq.c.user_id) \
        .order_by(asc(User.display_name))

    count_editable_stops = session.query(func.count(LogSavings.voting_station_id.distinct())).scalar()
    count_all_stops = session.query(func.count(VotingStation.id)).scalar()
    results = {'count': {'all': count_all_stops, 'editable': count_editable_stops},
               'stops_by_users': []}
    for user_stops_log in user_stops_log:
        results['stops_by_users'].append({'user_name': user_stops_log[0].display_name, 'count_stops': user_stops_log[1]})
    return Response(json.dumps(results))