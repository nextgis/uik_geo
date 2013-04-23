# -*- coding: utf-8 -*-
__author__ = 'karavanjo'

from pyramid.view import view_config
from pyramid.response import Response

from models import DBSession, Uik

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
    clauses = [Uik.geom.within(box_geom)]

    uiks_from_db = session.query(Uik, Uik.point.x, Uik.point.y) \
                          .filter(*clauses) \
                          .all()

    uiks_result = {'uiks': {'count': len(uiks_from_db), 'elements': uiks_from_db}}

    return Response(json.dumps(uiks_result))
