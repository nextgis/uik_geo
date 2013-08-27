from uik_ru.models import *
from uik_ru.helpers import get_utf_encoded_value

from sqlalchemy.orm import joinedload


class UikExportStrategy():
    def __init__(self, uik_export_strategy):
        self.strategy = uik_export_strategy

    def __start(self):
        self.strategy.start()

    def __end(self):
        self.strategy.end()

    def export_region(self, region_id):
        self.strategy.start(region_id)

        session = DBSession()
        uiks = session.query(Uik, Uik.point.x, Uik.point.y)\
            .options(joinedload('region'), joinedload('tik'), joinedload('geocoding_precision'))\
            .filter(Uik.region_id == region_id)

        for uik in uiks:
            self.strategy.export(uik)

        self.strategy.end()

    def export_all_regions(self):
        session = DBSession()
        regions = session.query(Region)\
            .filter(Region.imported == True)\
            .all()

        for region in regions:
            self.export_region(region.id)


class CsvUikExportStrategy():
    def __init__(self, dir_csv_file=''):
        self.dir = dir_csv_file
        self.csv_file = None
        self.writer = None
        from collections import OrderedDict
        self.scheme = OrderedDict([
            ('id', None),
            ('lat', None),
            ('lon', None),
            ('number_official', None),
            ('address_voting', None),
            ('place_voting', None),
            ('address_office', None),
            ('place_office', None),
            ('comment', None),
            ('is_applied', None),
            ('geocoding_precision', None),
            ('tik', None),
            ('region', None)
        ])

    def start(self, region_id):
        import csv
        self.csv_file = open('%(dir)s%(reg)s.csv' % {
            'dir': self.dir,
            'reg': region_id
        }, 'w+')
        self.csv_file.truncate()
        self.writer = csv.DictWriter(self.csv_file, self.scheme)
        self.writer.writeheader()

    def export(self, Uik):
        uik_csv = self.scheme
        uik_csv['id'] = Uik[0].id
        uik_csv['lon'] = Uik[1]
        uik_csv['lat'] = Uik[2]
        uik_csv['number_official'] = Uik[0].number_official
        uik_csv['address_voting'] = get_utf_encoded_value(Uik[0].address_voting)
        uik_csv['place_voting'] = get_utf_encoded_value(Uik[0].place_voting)
        uik_csv['address_office'] = get_utf_encoded_value(Uik[0].address_office)
        uik_csv['place_office'] = get_utf_encoded_value(Uik[0].place_office)
        uik_csv['comment'] = get_utf_encoded_value(Uik[0].comment)
        uik_csv['is_applied'] = Uik[0].is_applied
        uik_csv['geocoding_precision'] = get_utf_encoded_value(Uik[0].geocoding_precision.name)
        uik_csv['tik'] = get_utf_encoded_value(Uik[0].tik.name)
        uik_csv['region'] = get_utf_encoded_value(Uik[0].region.name)
        self.writer.writerow(uik_csv)

    def end(self):
        self.csv_file.close()