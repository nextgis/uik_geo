__author__ = 'karavanjo'


def str_to_boolean(s):
    return s.lower() in ("true", "1")


def leaflet_bbox_to_polygon(leafletBox):
    return 'POLYGON((%s %s, %s %s, %s %s, %s %s, %s %s))' % \
        (leafletBox['_southWest']['lng'], leafletBox['_southWest']['lat'], \
         leafletBox['_southWest']['lng'], leafletBox['_northEast']['lat'], \
         leafletBox['_northEast']['lng'], leafletBox['_northEast']['lat'], \
         leafletBox['_northEast']['lng'], leafletBox['_southWest']['lat'], \
         leafletBox['_southWest']['lng'], leafletBox['_southWest']['lat'])