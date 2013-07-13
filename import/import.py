import csv
from model import *

# ----------------------------------------
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

(options, args) = parser.parse_args()


# ----------------------------------------
# Read csv data of tiks
# ----------------------------------------
print 'Reading tiks csv file...'
tiks = TikRepository()
with open(options.csv_file_tik, 'rb') as csv_file_tik:
    reader = csv.reader(csv_file_tik)
    next(reader, None)
    for row in reader:
        tiks.add_tik(row)


# ----------------------------------------
# Read csv data of regions
# ----------------------------------------
print 'Reading regions csv file...'
regions = RegionRepository()
with open(options.csv_file_reg, 'rb') as csv_file_reg:
    reader = csv.reader(csv_file_reg)
    next(reader, None)
    for row in reader:
        regions.add_region(row)


# ----------------------------------------
# Read shp data of uiks
# ----------------------------------------
from my_shapefile import Reader

print 'Reading uiks shp file...'
shp = Reader(options.shp_file)
count_shapes = len(shp.shapes())
records = shp.shapeRecords()
shapes = shp.shapes()
geocoding_precisions = GeocodingPrecisionRepository()
uiks = UikRepository(geocoding_precisions)

for i in range(count_shapes - 1):
    record = records[i]
    uiks.add(record)


# ----------------------------------------
# Import to postgresql
# ----------------------------------------
import psycopg2

print 'Starting import data into Postgresql database...\n\r'
conn = "dbname='{0}' host='{1}' user='{2}' password='{3}'". \
    format(options.database, options.host, options.user, options.password)
con = psycopg2.connect(conn)
cur = con.cursor()

print 'Clearing data on uiks, uik_versions, geocoding_precisions, tiks and regions tables...'
cur.execute('DELETE FROM uiks;')
cur.execute('DELETE FROM uik_versions;')
cur.execute('DELETE FROM geocoding_precisions;')
cur.execute('DELETE FROM tiks;')
cur.execute('DELETE FROM regions;')
con.commit()
print 'Clearing data has been successful!\n\r'

print 'Starting import %s regions...' % regions.count()
cur.execute(regions.get_sql())
con.commit()
print 'Import of regions has been successful!\n\r'

print 'Starting import %s tiks...' % tiks.count()
cur.execute(tiks.get_sql())
con.commit()
print 'Import of tiks has been successful!\n\r'

print 'Starting import %s geocoding_precisions...' % geocoding_precisions.count()
cur.execute(geocoding_precisions.get_sql())
con.commit()
print 'Import of geocoding_precisions has been successful!\n\r'

print 'Starting import %s uiks...' % uiks.count()
cur.execute(uiks.get_sql())
con.commit()
print 'Import of uiks has been successful!\n\r'

print 'Rebuilding indexes on uiks, uik_versions, geocoding_precisions, tiks and regions tables...'
cur.execute('REINDEX TABLE uiks;')
cur.execute('REINDEX TABLE uik_versions;')
cur.execute('REINDEX TABLE geocoding_precisions;')
cur.execute('REINDEX TABLE tiks;')
cur.execute('REINDEX TABLE regions;')
con.commit()
print 'Rebuild of indexes has been successful!\n\r'

print 'Creating spatial index...'
cur.execute('DROP INDEX IF EXISTS uiks_spatial_index;')
cur.execute('CREATE INDEX uiks_spatial_index ON uiks USING GIST(point);')
con.commit()
print 'Creation of spatial index has been successful!\n\r'

cur.close()

print 'All operations completed.'