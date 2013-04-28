# -*- coding: utf-8 -*-
__author__ = 'karavanjo'

from pyramid.view import view_config
from pyramid.response import Response

from sqlalchemy.orm import joinedload

from models import DBSession, UikVotingStation, Location

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

    # todo need add other clauses
    # clauses = [].append(UikVotingStation.location.point.within(box_geom))

    uiks_from_db = session.query(UikVotingStation, Location.point.x, Location.point.y) \
                          .join(UikVotingStation.location) \
                          .filter(Location.point.within(box_geom)) \
                          .all()

    uiks_for_json = [{'id': uik[0].id, 'name': uik[0].name, 'lon': uik[1], 'lat': uik[2]} for uik in uiks_from_db]

    uiks_result = {'uiks': {'count': len(uiks_from_db), 'elements': uiks_for_json}}

    return Response(json.dumps(uiks_result))
