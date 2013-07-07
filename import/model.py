from helpers import *


class RegionRepository:
    def __init__(self):
        self.regions = dict()

    def get_regions(self):
        return self.regions

    def add_region(self, row):
        id = row[0]
        if id not in self.regions:
            self.regions[id] = {
                'id': id,
                'name': row[1]
            }
        return self.regions[id]

    def count(self):
        return len(self.regions.keys())

    def get_sql(self):
        sql = "INSERT INTO regions(id, name) VALUES "

        for key in self.regions:
            region = self.regions[key]
            sql += get_values([
                check_null(region['id']),
                check_null(region['name'])
            ]) + ","

        return sql[:-1] + ';'


class TikRepository:
    def __init__(self):
        self.tiks = dict()

    def get_tiks(self):
        return self.tiks

    def add_tik(self, row):
        id = row[1]
        if id not in self.tiks:
            self.tiks[id] = {
                'id': id,
                'name': row[2],
                'link_orig': row[3],
                'link_save': row[4],
                'region_id': row[0]
            }
        return self.tiks[id]

    def count(self):
        return len(self.tiks.keys())

    def get_sql(self):
        sql = "INSERT INTO tiks(id, name, link_orig, link_save, region_id) VALUES "

        for key in self.tiks:
            tik = self.tiks[key] 
            sql += get_values([
                check_null(tik['id']),
                check_null(tik['name']),
                check_null(tik['link_orig']),
                check_null(tik['link_save']),
                check_null(tik['region_id'])
            ]) + ","

        return sql[:-1] + ';'


class GeocodingPrecisionRepository:
    def __init__(self):
        self.geocoding_precisions = dict()
        self.geocoding_precision_index = 0

    def add(self, geocoding_precision_name):
        if geocoding_precision_name not in self.geocoding_precisions:
            self.geocoding_precisions[geocoding_precision_name] = self.geocoding_precision_index
            self.geocoding_precision_index += 1
        return self.geocoding_precisions[geocoding_precision_name]

    def count(self):
        return len(self.geocoding_precisions.keys())

    def get_dict(self):
        return self.geocoding_precisions

    def get_sql(self):
        sql = "INSERT INTO geocoding_precisions(id, name) VALUES "

        for name, id in self.geocoding_precisions.iteritems():
            sql += get_values([
                check_null(id),
                check_null(name)
            ]) + ","

        return sql[:-1] + ';'


class UikRepository:
    def __init__(self, geocoding_precision):
        self.uiks = []
        self.geocoding_precision = geocoding_precision

    def add(self, record):
        records = record.record
        uik = {
            'region_id': records[0],
            'tik_id': records[17],
            'number_official': records[2],
            'number_composite': '_'.join([str(records[17]), str(records[2])]),
            'address_voting': records[3],
            'place_voting': records[4],
            'address_office': records[5],
            'place_office': records[6],
            'comment': records[8],
            'geocoding_precision_id': self.geocoding_precision.add(records[16]),
            'point': record.shape.points[0]
        }
        self.uiks.append(uik)

    def count(self):
        return len(self.uiks)

    def get_uiks(self):
        return self.uiks

    def get_sql(self):
        sql = "INSERT INTO uiks(id, number_official, number_composite, address_voting, place_voting, address_office, " \
              "place_office, comment, point, is_applied, geocoding_precision_id, tik_id, region_id) VALUES "
        uik_id = 0
        for uik in self.uiks:
            sql += get_values([
                check_null(uik_id),
                check_null(uik['number_official']),
                check_null(uik['number_composite']),
                check_null(uik['address_voting']),
                check_null(uik['place_voting']),
                check_null(uik['address_office']),
                check_null(uik['place_office']),
                check_null(uik['comment']),
                "ST_GeomFromText('POINT(" + '{0} {1}'.format(uik['point'][0], uik['point'][1]) + ")', 4326)",
                'false',
                check_null(uik['geocoding_precision_id']),
                check_null(uik['tik_id']),
                check_null(uik['region_id']),
            ]) + ","
            uik_id += 1
        return sql[:-1] + ';'