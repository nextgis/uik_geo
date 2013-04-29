# -*- coding: utf-8 -*-
__author__ = 'karavanjo'

from pyramid.view import view_config
from pyramid.response import Response

from sqlalchemy.orm import joinedload

from models import DBSession, UikVotingStation, Location, District, Area, SubArea, Locality, Street

import json


@view_config(route_name='uiks', request_method='GET')
def get_all(context, request):
    session = DBSession()
    bbox_param = request.params.getall('bbox')[0]
    bbox = json.loads(bbox_param)
    box_geom = 'POLYGON((%s %s, %s %s, %s %s, %s %s, %s %s))' % \
               (bbox['_southWest']['lng'], bbox['_southWest']['lat'], \
                bbox['_southWest']['lng'], bbox['_northEast']['lat'], \
                bbox['_northEast']['lng'], bbox['_northEast']['lat'], \
                bbox['_northEast']['lng'], bbox['_southWest']['lat'], \
                bbox['_southWest']['lng'], bbox['_southWest']['lat'])

    clauses = []
    if 'filter' in request.GET:
        filter = json.loads(request.GET['filter'])
        address = filter['addr'].encode('UTF-8').strip()
        if filter['name'] or address:
            if address.__len__() > 3:
                address = '%' + address + '%'
                clauses.append(UikVotingStation.address.ilike(address))
            if filter['name']:
                name = filter['name']
                clauses.append(UikVotingStation.name == name)
        else:
            clauses.append(Location.point.within(box_geom))

    uiks_from_db = session.query(UikVotingStation, Location.point.x, Location.point.y) \
                          .join(UikVotingStation.location) \
                          .filter(*clauses) \
                          .all()

    uiks_for_json = [{'id': uik[0].id,
                      'name': uik[0].name,
                      'addr': uik[0].address,
                      'lon': uik[1],
                      'lat': uik[2]} for uik in uiks_from_db]

    uiks_result = {'uiks': {'count': len(uiks_from_db), 'elements': uiks_for_json}}

    return Response(json.dumps(uiks_result))

@view_config(route_name='uik', request_method='GET')
def get_uik(context, request):
    id = request.matchdict.get('id', None)
    session = DBSession()
    uik = session.query(UikVotingStation, Location, District, Area, SubArea, Locality, Street) \
        .join(UikVotingStation.location) \
        .outerjoin((District, Location.district_id == District.id)) \
        .outerjoin((Area, Location.area_id == Area.id)) \
        .outerjoin((SubArea, Location.sub_area_id == SubArea.id)) \
        .outerjoin((Locality, Location.locality_id == Locality.id)) \
        .outerjoin((Street, Location.street_id == Street.id)) \
        .filter(UikVotingStation.id == id).one()

    uik_res = {
        'uik': {
            'id': uik[0].id,
            'name': uik[0].name if uik[0].name else'',
            'district': uik[1].district.name if uik[1].district else '',
            'area': uik[1].area.name if uik[1].area else '',
            'sub_area': uik[1].sub_area.name if uik[1].sub_area else '',
            'locality': uik[1].locality.name if uik[1].locality else '',
            'street': uik[1].street.name if uik[1].street else '',
            'is_standalone': uik[0].is_standalone,
            'size': uik[0].size
        }
    }

    return Response(json.dumps(uik_res))