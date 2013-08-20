# encoding: utf-8

import transaction

from uik_ru.models import Uik, UikVersions, GeocodingPrecision
from uik_ru.models import WKTSpatialElement

import sqlite3 as lite


def addToUik(fileName, session, regionID):
    success = True
    dbsession = session
    stat = dict()
    stat['db'] = {
        'all': 0,
        'edited': 0
    }
    stat['import'] = {
        'no_import': 0,
        'updated': 0,
        'created': 0
    }

    with transaction.manager:
        # getting all precisions from db
        precisions_db = dbsession.query(GeocodingPrecision).all()
        precisions = dict()
        for precision in precisions_db:
            precisions[precision.name] = precision.id
        precisions['district'] = precisions['region']

        # getting uiks from the region with edited label
        uiks_with_versions = dict()
        uiks_with_versions_from_db = dbsession.query(Uik, UikVersions) \
            .outerjoin(UikVersions, Uik.id == UikVersions.uik_id) \
            .filter(Uik.region_id == regionID) \
            .distinct(Uik.id)

        # creating dictionary for store uik and edited label
        uiks_with_versions = dict()
        for uik in uiks_with_versions_from_db:
            stat['db']['all'] += 1
            if uik[1] is not None:
                stat['db']['edited'] += 1
            uiks_with_versions[uik[0].number_official] = {
                'edited': False if uik[1] is None else True,
                'uik': uik[0]
            }

        con = lite.connect(fileName)
        con.row_factory = lite.Row
        cur = con.cursor()

        import os
        table_name = os.path.splitext(os.path.basename(fileName))[0]
        for row in cur.execute("SELECT * FROM '%(table_name)s'" % {'table_name': table_name}):
            is_db_existed = row['uik'] in uiks_with_versions
            is_uik_edited = (row['uik'] in uiks_with_versions) and (uiks_with_versions[row['uik']]['edited'])

            print '\n\rREG: %(reg_id)s\tTIK: %(tik_id)s\tUIK: %(uik_id)s\tIn_DB: %(is_db_existed)s\tEdited: %(is_uik_edited)s' % {
                'reg_id': regionID,
                'tik_id': row['tik_id'],
                'uik_id': row['uik'],
                'is_db_existed': is_db_existed,
                'is_uik_edited': is_uik_edited
            }

            # when uik has versions don't import it
            if is_uik_edited:
                stat['import']['no_import'] += 1
                print "UIK with %(id)s has not been imported because it has EDITED state" % {
                    'id': uiks_with_versions[row['uik']]['uik'].id
                }
                continue

            uikRec = {
                'region_id': regionID,
                'tik_id': row['tik_id'],
                'number_official': row['uik'],
                'number_composite': '_'.join([str(row['tik_id']), str(row['uik'])]),
                'address_voting': row['addr_v'],
                'place_voting': row['place_v'],
                'address_office': row['addr_o'],
                'place_office': row['place_o'],
                'comment': None,
                'is_applied': False,
                'geocoding_precision_id': precisions[row['g_status']],
                'point': WKTSpatialElement("POINT(%s %s)" % (row['lon'], row['lat']), 4326)
            }

            if row['uik'] in uiks_with_versions:    # when uik exist in db update it
                uik_id = uiks_with_versions[row['uik']]['uik'].id
                dbsession.query(Uik)\
                    .filter(Uik.id == uik_id)\
                    .update(uikRec, synchronize_session=False)

                stat['import']['updated'] += 1
                print 'UIK with %(id)s was updated' % {
                    'id': uik_id
                }
            else:   # when uik doesn't exist in db create it
                uik = Uik()

                uik.number_official = uikRec['number_official']
                uik.number_composite = uikRec['number_composite']
                uik.address_voting = uikRec['address_voting']
                uik.place_voting = uikRec['place_voting']
                uik.address_office = uikRec['address_office']
                uik.place_office = uikRec['place_office']
                uik.comment = uikRec['comment']
                uik.point = uikRec['point']
                uik.is_applied = False
                uik.geocoding_precision_id = uikRec['geocoding_precision_id']
                uik.tik_id = uikRec['tik_id']
                uik.region_id = uikRec['region_id']

                dbsession.add(uik)
                stat['import']['created'] += 1
                print 'UIK was created'

    print stat
    return success