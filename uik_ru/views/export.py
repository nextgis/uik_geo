from models import *
from helpers import *
from decorators import authorized
from pyramid.view import view_config
from pyramid.response import Response
from sqlalchemy import func, distinct, and_
from sqlalchemy.orm import joinedload
from sqlalchemy.sql.expression import asc, desc
from geoalchemy import WKTSpatialElement, functions
import transaction

import json

@view_config(route_name='export', request_method='GET', renderer='export.mako')
def get_stat_page(context, request):
    session = DBSession()