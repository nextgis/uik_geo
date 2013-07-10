# -*- coding: utf-8 -*-

from models import DBSession, User

from pyramid.view import view_config
import transaction
from security import generate_session_id
from sqlalchemy.sql.expression import asc

from models import GeocodingPrecision


@view_config(route_name='home', renderer='base.mako')
def home(request):
    user_name = None
    if hasattr(request, 'cookies') and 'sk' in request.cookies.keys() and 'sk' in request.session and \
        request.session['sk'] == request.cookies['sk'] and 'u_name' in request.session:
        user_name = request.session['u_name']

    session = DBSession()
    geocoding_precisions = session.query(GeocodingPrecision).order_by(asc(GeocodingPrecision.id)).all()

    return {'u_name': user_name, 'project': 'uik_ru', 'geocoding_precisions': geocoding_precisions}

@view_config(route_name='home', request_method='POST', renderer='base.mako')
def home_signin(request):
    result = home(request)

    if 'sign_out' in request.POST.keys():
        request.session.invalidate()
        result['u_name'] = None

    else:
        email = request.POST['mail']
        password = request.POST['pass']
        session = DBSession()
        user = session.query(User) \
            .filter(User.email == email, User.password == User.password_hash(password, 'rte45EWRRT')) \
            .first()
        if user:
            request.session['sk'] = generate_session_id()
            request.session['u_name'] = user.display_name
            request.session['u_id'] = user.id
            request.response.set_cookie('sk', value=request.session['sk'], max_age=86400)
            result['u_name'] = user.display_name

    return result

@view_config(route_name='register', renderer='register.mako')
def register(request):
    return {}


@view_config(route_name='register', request_method='POST', renderer='register.mako')
def register_post(request):
    session = DBSession()
    errors = []
    info = ''

    if not request.POST['name']:
        errors.append(u'Вы не указали ваше имя')

    if request.POST['email']:
        import re
        if not re.match(r"[^@]+@[^@]+\.[^@]+", request.POST['email']):
            errors.append(u'Неправильный формат адреса электронной почты - адрес должен иметь вид user@server.ru')
        existed_email = session.query(User.email).filter(User.email == request.POST['email']).count()
        if existed_email > 0:
            errors.append(u'Пользователь с таким адресом электронной почты (%s) уже существует' % request.POST['email'])
    else:
        errors.append(u'Вы не указали адрес вашей электронной почты')

    if 'password' in request.POST.keys() or request.POST['pass']:
        if not request.POST['pass2'] or request.POST['pass'] != request.POST['pass2']:
            errors.append(u'Введенные вами пароли не совпадают')
        if len(request.POST['pass']) < 5:
            errors.append(u'Длина пароля должна быть больше 4 символов')
    else:
        errors.append(u'Вы не указали пароль')

    if not errors:
        user = User()
        user.display_name = request.POST['name']
        user.email = request.POST['email']
        user.password = User.password_hash(request.POST['pass'], 'rte45EWRRT')
        session.add(user)
        transaction.commit()
        info = u'Вы зарегистрированы. Поздравляем!'
    return {
        'errors': errors,
        'info': info
    }