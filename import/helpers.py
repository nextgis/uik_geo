def get_values(args):
    return "(" + ",".join(args) + ")"


def check_null(arg):
    return 'NULL' if arg is None or arg is '' else "'" + str(arg) + "'"