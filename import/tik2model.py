# encoding: utf-8

import csv
import transaction

from uik_ru.models import Tik

def get_tiks_from_db(dbsession):
    tiks = dict()

    tiks_from_db = dbsession.query(Tik).all()
    for tik in tiks_from_db:
        tiks[tik.id] = tik

    return tiks


def validate_tik_db_name(db_tik, tik_name):
    return db_tik.name == tik_name


def validate_tik_db_region(db_tik, tik_region_id):
    if db_tik.region_id != tik_region_id:
        raise 'Verification error: Tik with id = %(tik_id)s is not matched by REGION_ID:\n\r' \
              'in db = "%(db_region_id)s"\n\r' \
              'in csv = "%(csv_region_id)s"\n\r' % \
              {
                  'tik_id': db_tik.id,
                  'db_region_id': db_tik.region_id,
                  'csv_region_id': tik_region_id
              }


def addToTik(fileName, session):
    success = True
    dbsession = session

    tiks_from_db = get_tiks_from_db(dbsession)
    stat = {
        'count_in_db': 0,
        'updated': 0,
        'created': 0
    }

    with transaction.manager:
        with open(fileName, 'rb') as csvFile:
            reader = csv.DictReader(csvFile)
            for row in reader:
                tik_id = int(row['tik_id'])
                tik_name = row['tik'].decode('utf-8')
                tik_region_id = int(row['auto_code'])

                if tik_id in tiks_from_db:
                    stat['count_in_db'] += 1
                    print 'REG: %(reg_id)s\tTIK: %(tik_id)s\talready exists in db' % {
                        'reg_id': row['auto_code'],
                        'tik_id': tik_id
                    }
                    validate_tik_db_region(tiks_from_db[tik_id], tik_region_id)
                    if validate_tik_db_name(tiks_from_db[tik_id], tik_name) is False:
                        dbsession.query(Tik).filter(Tik.id == tik_id).update({
                            'name': tik_name
                        })
                        stat['updated'] += 1
                        print 'REG: %(reg_id)s\tTIK: %(tik_id)s\twas updated' % {
                            'reg_id': row['auto_code'],
                            'tik_id': tik_id
                        }
                    continue

                tik = Tik()
                tik.id = tik_id
                tik.name = tik_name
                tik.region_id = row['auto_code']
                dbsession.add(tik)

                stat['created'] += 1
                print 'REG: %(reg_id)s\tTIK: %(tik_id)s\t was added' % {
                    'reg_id': tik.region_id,
                    'tik_id': tik.id
                }

    print stat
    return success