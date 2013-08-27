from os.path import join
from ..models import DBSession, Region
from pyramid.view import view_config
from pyramid.response import FileResponse
import pkg_resources

@view_config(route_name='uik_export_page', renderer='export.mako')
def get_export_page(context, request):
    session = DBSession()

    imported_regions = session.query(Region)\
        .filter(Region.imported == True)\
        .order_by(Region.id)

    regions = []
    for region in imported_regions:
        regions.append(region.to_dict())

    return {'regions': regions}

@view_config(route_name='uik_export', request_method='GET')
def get_export_file(context, request):
    region_id = request.matchdict.get('region_id', None)
    file_type = request.matchdict.get('file_type', None)

    file_name = '%(region_id)s.%(file_type)s.zip' % {
        'region_id': region_id,
        'file_type': file_type
    }

    response = FileResponse(
        pkg_resources.resource_filename('uik_ru', join('data/export/uiks/', file_name)),
        request=request
    )
    return response
