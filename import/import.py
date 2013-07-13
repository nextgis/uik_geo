import csv

from uik_ru.models import Uik, Tik, Region, GeocodingPrecision

import file2model


# Run:
# env/bin/python import/import.py --d uik_ru --h localhost --u uik_ru --p uik_ru  --s import/data/RU-MOW.shp  --tik import/data/tik.csv  --reg import/data/auto_codes.csv --config development.ini


from sqlalchemy import engine_from_config
from pyramid.paster import get_appsettings
from uik_ru.models import DBSession, Base

# Read command line arguments
# ----------------------------------------
from optparse import OptionParser

parser = OptionParser()

parser.add_option("--d", dest="database")
parser.add_option("--h", dest="host")
parser.add_option("--u", dest="user")
parser.add_option("--p", dest="password")
parser.add_option("--s", dest="shp_file")
parser.add_option("--tik", dest="csv_file_tik")
parser.add_option("--reg", dest="csv_file_reg")
parser.add_option("--config", dest="config_file")

(options, args) = parser.parse_args()

# Read SQLAlchemy config:
# ----------------------------------------
config_uri = options.config_file
settings = get_appsettings(config_uri)
engine = engine_from_config(settings, 'sqlalchemy.')
DBSession.configure(bind=engine)

# !!!
# Next 2 lines kill all data! Delete them from final version!!!:
# ----------------------------------------
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)

print file2model.addToGeocodingPrecision(session=DBSession())
print file2model.addToRegion(options.csv_file_reg, session=DBSession())
print file2model.addToTik(options.csv_file_tik, session=DBSession())
print file2model.addToUik(options.shp_file, session=DBSession())

