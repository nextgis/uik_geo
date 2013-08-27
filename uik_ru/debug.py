from pyramid.config import Configurator
from sqlalchemy import engine_from_config
from pyramid.paster import get_appsettings
from pyramid_beaker import session_factory_from_settings
from pyramid_beaker import set_cache_regions_from_settings
from apscheduler.scheduler import Scheduler
from modules.export.export import UikExportStrategy, CsvUikExportStrategy
from uik_ru.models import DBSession
from uik_ru.modules.export import zip

import os

settings = get_appsettings('/home/karavanjo/projects/uik_ru/uik_ru/development.ini')
engine = engine_from_config(settings, 'sqlalchemy.')
DBSession.configure(bind=engine)

dir = os.path.dirname(__file__)
export_dir_name = os.path.join(dir, 'data/export/uiks/')

from shutil import rmtree
rmtree(export_dir_name)
os.makedirs(export_dir_name)

exporter = UikExportStrategy(CsvUikExportStrategy(export_dir_name))
exporter.export_all_regions()
zip.zip_all(export_dir_name)