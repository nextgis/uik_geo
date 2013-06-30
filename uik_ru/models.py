__author__ = 'karavanjo'

from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Text,
    Sequence,
    Boolean,
    DateTime,
    LargeBinary
)

from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION

from geoalchemy import (
    GeometryColumn,
    Geometry,
    Polygon
)

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy.orm import (
    scoped_session,
    sessionmaker,
    relationship,
)

from zope.sqlalchemy import ZopeTransactionExtension

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()


class District(Base):
    __tablename__ = 'district'

    id = Column(Integer, Sequence('district_id_seq'), primary_key=True)
    name = Column(Text, nullable=True)


class Area(Base):
    __tablename__ = 'area'

    id = Column(Integer, Sequence('area_id_seq'), primary_key=True)
    name = Column(Text, nullable=True)
    bounds_left = Column(DOUBLE_PRECISION)
    bounds_right = Column(DOUBLE_PRECISION)
    bounds_top = Column(DOUBLE_PRECISION)
    bounds_bottom = Column(DOUBLE_PRECISION)
    box = GeometryColumn(Polygon(2))
    district = relationship('District')
    district_id = Column(Integer, ForeignKey('district.id'), nullable=True)


class Locality(Base):
    __tablename__ = 'locality'

    id = Column(Integer, Sequence('locality_id_seq'), primary_key=True)
    name = Column(Text, nullable=True)
    bounds_left = Column(DOUBLE_PRECISION)
    bounds_right = Column(DOUBLE_PRECISION)
    bounds_top = Column(DOUBLE_PRECISION)
    bounds_bottom = Column(DOUBLE_PRECISION)
    box = GeometryColumn(Polygon(2))
    district = relationship('District')
    district_id = Column(Integer, ForeignKey('district.id'), nullable=True)
    area = relationship('Area')
    area_id = Column(Integer, ForeignKey('area.id'), nullable=True)


class Street(Base):
    __tablename__ = 'street'

    id = Column(Integer, Sequence('street_id_seq'), primary_key=True)
    name = Column(Text, nullable=True)
    bounds_left = Column(DOUBLE_PRECISION)
    bounds_right = Column(DOUBLE_PRECISION)
    bounds_top = Column(DOUBLE_PRECISION)
    bounds_bottom = Column(DOUBLE_PRECISION)
    box = GeometryColumn(Polygon(2))
    locality = relationship('Locality')
    locality_id = Column(Integer, ForeignKey('locality.id'), nullable=True)


class SubArea(Base):
    __tablename__ = 'sub_area'

    id = Column(Integer, Sequence('area_id_seq'), primary_key=True)
    name = Column(Text, nullable=True)
    district = relationship('District')
    district_id = Column(Integer, ForeignKey('district.id'), nullable=True)
    area = relationship(Area)
    area_id = Column(Integer, ForeignKey('area.id'), nullable=True)
    bounds_left = Column(DOUBLE_PRECISION)
    bounds_right = Column(DOUBLE_PRECISION)
    bounds_top = Column(DOUBLE_PRECISION)
    bounds_bottom = Column(DOUBLE_PRECISION)
    box = GeometryColumn(Polygon(2))


class Location(Base):
    __tablename__ = 'location'

    id = Column(Integer, Sequence('location_id_seq'), primary_key=True)
    point = GeometryColumn(Geometry(2, 4326, nullable=False))
    address = Column(Text, index=True, nullable=True)
    raw_address = Column(Text, nullable=True)
    lat = Column(DOUBLE_PRECISION)
    lon = Column(DOUBLE_PRECISION)
    district = relationship('District')
    district_id = Column(Integer, ForeignKey('district.id'))
    area = relationship('Area')
    area_id = Column(Integer, ForeignKey('area.id'))
    sub_area = relationship('SubArea')
    sub_area_id = Column(Integer, ForeignKey('sub_area.id'))
    locality = relationship('Locality')
    locality_id = Column(Integer, ForeignKey('locality.id'))
    street = relationship('Street')
    street_id = Column(Integer, ForeignKey('street.id'))


class VotingStation(Base):
    __tablename__ = 'voting_station'

    id = Column(Integer, Sequence('voting_station_id_seq'), primary_key=True)
    name = Column(Text, nullable=True)
    address = Column(Text, index=True, nullable=True)
    comment = Column(Text, nullable=True)
    is_standalone = Column(Boolean)
    size = Column(Text, nullable=True)
    location = relationship('Location')
    location_id = Column('location_id', Integer, ForeignKey('location.id'))
    is_checked = Column(Boolean)
    is_committee_here = Column(Boolean, index=True, nullable=False)
    is_blocked = Column(Boolean, nullable=True)
    user_block = relationship('User')
    user_block_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    committee_location = relationship('Location')
    committee_location_id = Column('location_id', Integer, ForeignKey('location.id'))


class UikVersions(Base):
    __tablename__ = 'uik_versions'

    uik = relationship('')
    voting_station_id = Column(Integer, ForeignKey('voting_station.id'), nullable=False, primary_key=True)
    user = relationship('User')
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, primary_key=True)
    time = Column(DateTime, nullable=False, primary_key=True)


class Uik(Base):
    __tablename__ = 'uiks'

    id = Column(Integer, Sequence('uik_id_seq'))
    number_official = Column(Text, nullable=False, index=True)
    number_composite = Column(Text, nullable=False, index=True)
    address_voting = Column(Text, nullable=False, index=True)
    place_voting = Column(Text, index=True)
    address_office = Column(Text, index=True)
    place_office = Column(Text, index=True)
    comment = Column(Text)
    point = GeometryColumn(Geometry(2, 4326, spatial_index=True))
    is_applied = Column(Boolean, nullable=False)
    geocoding_precision = relationship('geocoding_precisions')
    geocoding_precision_id = Column(Integer, ForeignKey('geocoding_precisions.id'), nullable=False, index=True)
    tik = relationship('Tik')
    tik_id = Column(Integer, ForeignKey('tiks.id'), nullable=False, primary_key=True)
    region = relationship('Region')
    region_id = Column(Integer, ForeignKey('regions.id'), nullable=False)


class Tik(Base):
    __tablename__ = 'tiks'

    id = Column(Integer, Sequence('tik_id_seq'), primary_key=True)
    name = Column(Text)
    link_orig = Column(Text)
    link_save = Column(Text)
    region = relationship('Region')
    region_id = Column(Integer, ForeignKey('regions.id'), nullable=False)


class Region(Base):
    __tablename__ = 'regions'

    # Id of region matches to region code
    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)


class GeocodingPrecision(Base):
    __tablename__ = 'geocoding_precisions'

    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, Sequence('users_id_seq'), primary_key=True)
    email = Column(Text)
    password = Column(Text)
    display_name = Column(Text)


    @classmethod
    def password_hash(cls, password, salt):
        import hashlib
        return hashlib.sha1(password + salt).hexdigest()

    def as_dict(self, **addon):
        return dict(id=self.id, email=self.email, display_name=self.display_name, **addon)