cd uik_ru;
#ant default;
cd ..;
../bin/pserve development.ini --stop;
../bin/pserve development.ini --daemon;
