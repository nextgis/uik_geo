from pyramid.config import Configurator
from sqlalchemy import engine_from_config
from pyramid_beaker import session_factory_from_settings
from pyramid_beaker import set_cache_regions_from_settings

from .models import (
    DBSession,
    Base,
)

def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)
    Base.metadata.bind = engine
    session_factory = session_factory_from_settings(settings)
    set_cache_regions_from_settings(settings)
    config = Configurator(settings=settings)
    config.set_session_factory(session_factory)
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.add_route('home', '/')
    config.add_route('uiks', '/uik/all')
    config.add_route('stat_json', '/uik/stat/json')
    config.add_route('statistic', '/uik/stat')
    config.add_route('uik', '/uik/{id}')
    config.add_route('uik_by_off_number', '/uik/{region_id}/{official_number}')
    config.add_route('register', '/register')
    config.add_route('uik_block', '/uik/block/{id}')
    config.add_route('uik_unblock', '/uik/unblock/{id}')
    config.add_route('logs', '/logs')
    config.add_route('uikp_all', '/uikp/all')
    config.add_route('uikp', '/uikp/{id}')
    config.scan()
    return config.make_wsgi_app()
