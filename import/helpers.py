def get_values(args):
    return "(" + ",".join(args) + ")"


def check_null(arg):
    return "'" + str(arg) + "'" if arg is not (None or '') else 'NULL'