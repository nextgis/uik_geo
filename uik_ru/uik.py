# -*- coding: utf-8 -*-
__author__ = 'karavanjo'

from models import DBSession, VotingStation, Location, District, Area, SubArea, Locality, Street, User, LogSavings
from decorators import authorized
from pyramid.view import view_config
from pyramid.response import Response
from sqlalchemy import func
from geoalchemy import WKTSpatialElement, functions
import transaction

import json


@view_config(route_name='uiks', request_method='GET')
def get_all(context, request):
    page_size = 50
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
                clauses.append(VotingStation.address.ilike(address))
            if filter['name']:
                name = filter['name']
                clauses.append(VotingStation.name == name)

    session = DBSession()
    if is_filter_applied:
        screen_center_param = json.loads(request.params.getall('center')[0])
        screen_center = 'POINT(%s %s)' % (screen_center_param['lng'], screen_center_param['lat'])
        uiks_from_db = session.query(VotingStation, Location.point.x, Location.point.y) \
            .join(VotingStation.location) \
            .filter(*clauses) \
            .order_by(functions.distance(Location.point, WKTSpatialElement(screen_center))) \
            .limit(page_size) \
            .all()
        if len(uiks_from_db) > page_size:
            count = len(uiks_from_db)
        else:
            count = session.query(VotingStation.id) \
                .filter(*clauses) \
                .count()
    else:
        bbox = json.loads(request.params.getall('bbox')[0])
        box_geom = 'POLYGON((%s %s, %s %s, %s %s, %s %s, %s %s))' % \
                    (bbox['_southWest']['lng'], bbox['_southWest']['lat'],\
                    bbox['_southWest']['lng'], bbox['_northEast']['lat'],\
                    bbox['_northEast']['lng'], bbox['_northEast']['lat'],\
                    bbox['_northEast']['lng'], bbox['_southWest']['lat'],\
                    bbox['_southWest']['lng'], bbox['_southWest']['lat'])
        uiks_from_db = session.query(VotingStation, Location.point.x, Location.point.y) \
            .join(VotingStation.location) \
            .filter(Location.point.within(box_geom)) \
            .all()
        count = len(uiks_from_db)

    uiks_for_json = [{'id': uik[0].id,
                      'name': uik[0].name,
                      'addr': uik[0].address,
                      'lon': uik[1],
                      'lat': uik[2]} for uik in uiks_from_db]

    uiks_result = {'uiks': {'count_all': count, 'count': len(uiks_for_json), 'elements': uiks_for_json}}

    return Response(json.dumps(uiks_result))


@view_config(route_name='uik', request_method='GET')
def get_uik(context, request):
    id = request.matchdict.get('id', None)
    session = DBSession()
    uik = session.query(VotingStation, Location, Location.point.x, Location.point.y, \
                        District, Area, SubArea, Locality, Street) \
        .join(VotingStation.location) \
        .outerjoin((District, Location.district_id == District.id)) \
        .outerjoin((Area, Location.area_id == Area.id)) \
        .outerjoin((SubArea, Location.sub_area_id == SubArea.id)) \
        .outerjoin((Locality, Location.locality_id == Locality.id)) \
        .outerjoin((Street, Location.street_id == Street.id)) \
        .outerjoin((User, VotingStation.user_block_id == User.id)) \
        .filter(VotingStation.id == id).one()

    uik_res = {
        'uik': {
            'id': uik[0].id,
            'name': uik[0].name if uik[0].name else'',
            'is_checked': uik[0].is_checked if uik[0].is_checked else False,
            'comment': uik[0].comment if uik[0].comment else '',
            'address': uik[0].address if uik[0].address else ''
        }
    }

    uik_res['uik']['geom'] = {'id': uik[1].id, 'lon': uik[2], 'lat': uik[3]}

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
        'wkt': 'POINT(%s %s)' % (uik['geom']['lon'], uik['geom']['lat']),
        'location_id': uik['geom']['id']
    })

    log = LogSavings()
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