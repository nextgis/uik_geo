# encoding: utf-8

import csv

import transaction

from my_shapefile import Reader

from uik_ru.models import Uik, Tik, Region, GeocodingPrecision
from uik_ru.models import DBSession, WKTSpatialElement
import sqlite3 as lite


def addToUik(fileName, session, regionID):

    tiks = dict()
    success = True
    dbsession = session
    with transaction.manager:
        dbsession.query(Uik).filter(Uik.region_id==regionID).delete()
        dbsession.query(Tik).filter(Tik.region_id==regionID).delete()

        precisions_db = dbsession.query(GeocodingPrecision) \
            .all()
        precisions = dict()
        for prec in precisions_db:
            precisions[prec.name] = prec.id
        precisions['district'] = precisions['region']

        con = lite.connect(fileName)
        con.row_factory = lite.Row
        cur = con.cursor()

        for row in cur.execute("SELECT * FROM '%s'" % regionID):
            if row['auto_code'] == regionID:

                if row['tik_id'] not in tiks:
                    tiks[row['tik_id']] = row['tik']

                    tik = Tik()
                    tik.name = row['tik']
                    tik.id = row['tik_id']
                    tik.region_id = regionID
                    dbsession.add(tik)

                uikRec = {
                    'region_id': row['auto_code'],
                    'tik_id': row['tik_id'],
                    'number_official': row['uik'],
                    'number_composite': '_'.join([str(row['tik_id']), str(row['uik'])]),
                    'address_voting': row['addr_v'],
                    'place_voting': row['place_v'],
                    'address_office': row['addr_o'],
                    'place_office': row['place_o'],
                    'comment': row['info'],
                    'geocoding_precision_id': precisions[row['g_status']],
                    'point': "POINT(%s %s)" % (row['lon'], row['lat'])
                }

                uik = Uik()
                uik.number_official = uikRec['number_official']
                uik.number_composite = uikRec['number_composite']
                uik.address_voting = uikRec['address_voting']
                uik.place_voting = uikRec['place_voting']
                uik.address_office = uikRec['address_office']
                uik.place_office = uikRec['place_office']
                uik.comment = uikRec['comment']
                uik.point = WKTSpatialElement(uikRec['point'], 4326)
                uik.is_applied = False
                uik.geocoding_precision_id = uikRec['geocoding_precision_id']
                uik.tik_id = uikRec['tik_id']
                uik.region_id = uikRec['region_id']

                dbsession.add(uik)

    return success