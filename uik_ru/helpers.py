__author__ = 'karavanjo'


DATETIME_FORMAT = '%d.%m.%Y %H:%M'


def str_to_boolean(s):
    return s.lower() in ("true", "1")


def leaflet_bbox_to_polygon(leafletBox):
    return 'POLYGON((%s %s, %s %s, %s %s, %s %s, %s %s))' % \
        (leafletBox['_southWest']['lng'], leafletBox['_southWest']['lat'], \
         leafletBox['_southWest']['lng'], leafletBox['_northEast']['lat'], \
         leafletBox['_northEast']['lng'], leafletBox['_northEast']['lat'], \
         leafletBox['_northEast']['lng'], leafletBox['_southWest']['lat'], \
         leafletBox['_southWest']['lng'], leafletBox['_southWest']['lat'])


def to_russian_datetime_format(datetime):
	return datetime.strftime(DATETIME_FORMAT)