# Run:
# env/bin/python import/import.py --d uik_ru --h localhost --u uik_ru --p uik_ru  --s import/data/RU-MOW.shp  --tik import/data/tik.csv  --reg import/data/auto_codes.csv --config development.ini


from sqlalchemy import engine_from_config
from pyramid.paster import get_appsettings
from uik_ru.models import DBSession, Base

# Read command line arguments
# ---------------------------
import argparse

parser = argparse.ArgumentParser(add_help=False)
subparsers = parser.add_subparsers()

tik_parser = subparsers.add_parser('tik')
tik_parser.add_argument('--csv', dest='csv', help='path to tik .csv file')
tik_parser.add_argument('--conf', dest='sql_config', help='path to sqlalchemy config')

uik_parser = subparsers.add_parser('uik')
uik_parser.add_argument('--region', dest='region', type=int, help='code of region (ex. 77 for Moscow)')
uik_parser.add_argument('--sqlt', dest='sqlite', help='path to sqlite database file')
uik_parser.add_argument('--conf', dest='sql_config', help='path to sqlalchemy config')

args = parser.parse_args()

# Read SQLAlchemy config:
# ----------------------------------------

if args.sql_config:
    config_uri = args.sql_config
    settings = get_appsettings(config_uri)
    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)
else:
    raise 'sql_config parameter (--conf) is required'

if 'csv' in args:
    import tik2model
    tik2model.addToTik(args.csv, session=DBSession())
elif 'sqlite' in args:
    import uik2model
    uik2model.addToUik(args.sqlite, session=DBSession(), regionID=args.region)