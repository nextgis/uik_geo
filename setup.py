import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.txt')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()

requires = [
    'pyramid',
    'pyramid_beaker',
    'SQLAlchemy',
    'transaction',
    'pyramid_tm',
    'pyramid_debugtoolbar',
    'zope.sqlalchemy',
    'waitress',

    'psycopg2',
    'geoalchemy',
    'shapely',
    'apscheduler'
    ]

setup(name='uik_ru',
      version='0.0',
      description='uik_ru',
      long_description=README + '\n\n' + CHANGES,
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pyramid",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      author='Ivan Kavaliou',
      author_email='jownkiv@gmail.com',
      url='',
      keywords='web pyramid pylons uik geoalchemy leaflet map',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      install_requires=requires,
      tests_require=requires,
      test_suite="uik_ru",
      entry_points="""\
      [paste.app_factory]
      main = uik_ru:main
      [console_scripts]
      initialize_uik_ru_db = uik_ru.scripts.initializedb:main
      """,
      )
