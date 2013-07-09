from helpers import *
import unittest


class CheckNullTests(unittest.TestCase):
    def test_get_NULL_when_input_value_equal_None(self):
        arg = None
        self.assertEquals('NULL', check_null(arg))

    def test_get_NULL_when_input_value_equal_empty_string(self):
        arg = ''
        self.assertEquals('NULL', check_null(arg))

    def test_get_string_when_input_value_is_not_empty(self):
        arg = 'test'
        self.assertEquals("'test'", check_null(arg))

if __name__ == '__main__':
    unittest.main()