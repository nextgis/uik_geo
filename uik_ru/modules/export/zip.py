from os import listdir, remove
from os.path import isfile, join
from shutil import rmtree

from uik_ru.helpers import zip_dir

import zipfile


def zip_all(dir):
    for file_obj_name in listdir(dir):
        full_name = join(dir, file_obj_name)
        zip = zipfile.ZipFile('%s.zip' % full_name, 'w')
        if isfile(full_name):
            zip.write(full_name, arcname=file_obj_name)
            zip.close()
            remove(full_name)
        else:
            zip_dir(full_name, zip)
            zip.close()
            rmtree(full_name)