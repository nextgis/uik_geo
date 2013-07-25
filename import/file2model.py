# encoding: utf-8

import csv

import transaction

from my_shapefile import Reader

from uik_ru.models import Uik, Tik, Region, GeocodingPrecision
from uik_ru.models import DBSession, WKTSpatialElement


# TODO: Была мысль сделать одну функцию на все таблицы, на основе цикла,
# который создавал бы записи по csv-файлу. Что-то типа такого:
#~ for k,v in row.items():
    #~ if v == '': v = None
    #~ if hasattr(region, k): setattr(region, k, v)
# Не осилил. Сделал по-тупому


def addToRegion(fileName, session):
    success = True
    dbsession = session
    with transaction.manager:
        with open(fileName, 'rb') as csvFile:
            reader = csv.DictReader(csvFile)
            for row in reader:
                region = Region()
                region.id   = row['code']
                region.name = row['region']
                dbsession.add(region)
    return success

def addToGeocodingPrecision(session):
    geocoding_precisions = {
            'region': {'name_ru': u'Район', 'id': 0},
            'settlement': {'name_ru': u'Населенный пункт', 'id': 1},
            'street': {'name_ru': u'Улица', 'id': 2},
            'building': {'name_ru': u'Дом', 'id': 3}
    }
    success = True
    dbsession = session
    with transaction.manager:
        for name, row in geocoding_precisions.items():
            prec = GeocodingPrecision()
            prec.id   = row['id']
            prec.name = name
            prec.name_ru = row['name_ru']
            dbsession.add(prec)
    return success


def addToTik(fileName, session, regionID=None):
    """
    Если указан regionID, то ВСЕ участки этого региона удаляются,
    затем из файла импортируются ТИКи данного региона.
    Внимание!!! Здесь также удаляются УИКи, привязанные к региону.
    Если не указан regionID, то импортируется все ТИКи.
    """
    processAll = (regionID==None)
    tiks = dict()
    success = True
    dbsession = session
    with transaction.manager:
        if not processAll:
            dbsession.query(Uik).filter(Uik.region_id==regionID).delete()
            dbsession.query(Tik).filter(Tik.region_id==regionID).delete()

        with open(fileName, 'rb') as csvFile:
            reader = csv.DictReader(csvFile)
            for row in reader:
                if processAll or row['auto_code'] == regionID:
                    if row['tik_id'] in tiks:
                        continue
                    tik = Tik()
                    tik.id   = row['tik_id']
                    tik.name = row['tik']
                    # tik.link_orig = row['link_orig']
                    # tik.link_save = row['link_save']
                    tik.region_id = row['auto_code']
                    tiks[tik.id] = None
                    dbsession.add(tik)
    return success


def addToUik(fileName, session, regionID=None):
    """
    Если указан regionID, то из файла импортируются УИКи данного региона.
    Внимание!!! Здесь не удаляются УИКи -- они должны быть удалены вместе с ТИКами.
    Если не указан regionID, то импортируется все УИКи.
    """
    processAll = (regionID==None)
    success = True
    dbsession = session
    with transaction.manager:
        shp = Reader(fileName)
        count_shapes = len(shp.shapes())
        records = shp.shapeRecords()
        shapes = shp.shapes()

        fields = shp.fields
        field_index = 0
        shp_fields = dict()
        for field in fields:
            if field[0] == 'DeletionFlag':
                continue
            shp_fields[field[0]] = field_index
            field_index += 1

        precisions_db = dbsession.query(GeocodingPrecision) \
            .all()

        precisions = dict()
        for prec in precisions_db:
            precisions[prec.name] = prec.id
        precisions['district'] = precisions['region']

        for i in range(count_shapes - 1):
            record = records[i]
            row = record.record
            if processAll or row[shp_fields['auto_code']] == regionID:
                uikRec = {
                    'region_id': row[shp_fields['auto_code']],
                    'tik_id': row[shp_fields['tik_id']],
                    'number_official': row[shp_fields['uik']],
                    'number_composite': '_'.join([str(row[shp_fields['tik_id']]), str(row[shp_fields['uik']])]),
                    'address_voting': row[shp_fields['addr_v']],
                    'place_voting': row[shp_fields['place_v']],
                    'address_office': row[shp_fields['addr_o']],
                    'place_office': row[shp_fields['place_o']],
                    'comment': row[shp_fields['info']],
                    'geocoding_precision_id': precisions[row[shp_fields['g_status']]],
                    'point' : "POINT(%s %s)" % (record.shape.points[0][0], record.shape.points[0][1])
                }

                uik = Uik()
                uik.number_official  = uikRec['number_official']
                uik.number_composite  = uikRec['number_composite']
                uik.address_voting  = uikRec['address_voting']
                uik.place_voting  = uikRec['place_voting']
                uik.address_office  = uikRec['address_office']
                uik.place_office  = uikRec['place_office']
                uik.comment  = uikRec['comment']
                uik.point  = WKTSpatialElement(uikRec['point'], 4326)
                uik.is_applied  = False
                uik.geocoding_precision_id  = uikRec['geocoding_precision_id']
                uik.tik_id  = uikRec['tik_id']
                uik.region_id  = uikRec['region_id']

                dbsession.add(uik)
    return success
