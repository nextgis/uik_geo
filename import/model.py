

class Tik:
    def __init__(self, geocoding_precision):
        self.tiks = dict()
        self.geocoding_precision = geocoding_precision

    def get_tiks(self):
        return self.tiks

    def add_tik(self, record):
        records = record.record
        return {
            'region_id': records[0],
            'tik_id': records[1],
            'number_official': records[2],
            'address_voting': records[3],
            'place_voting': records[4],
            'address_office': records[5],
            'place_office': records[7],
            'comment': records[8],
            'geocoding_precision_id': self.geocoding_precision.get_geocoding_precision_id(records[9]),
            'point': record.shape.points[0]
        }


class GeocodingPrecision:
    def __init__(self):
        self.geocoding_precisions = dict()
        self.geocoding_precision_index = 0

    def add(self, geocoding_precision_name):
        if geocoding_precision_name in self.geocoding_precisions:
            return self.geocoding_precisions[geocoding_precision_name]
        else:
            self.geocoding_precision_index += 1
            self.geocoding_precisions[geocoding_precision_name] = self.geocoding_precision_index

    def get_dict(self):
        return self.geocoding_precisions


class Uik:
    def __init__(self, geocoding_precision):
        self.uiks = []
        self.geocoding_precision = geocoding_precision

    def add(self, record):
        records = record.record
        uik = {
            'region_id': records[0],
            'tik_id': records[1],
            'number_official': records[2],
            'address_voting': records[3],
            'place_voting': records[4],
            'address_office': records[5],
            'place_office': records[7],
            'comment': records[8],
            'geocoding_precision_id': self.geocoding_precision.get_geocoding_precision_id(records[9]),
            'point': record.shape.points[0]
        }
        self.uiks.append(uik)

    def get_uiks(self):
        return self.uiks