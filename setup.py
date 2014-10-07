#!/usr/bin/env python
from distutils.core import setup

setup(
    name='wearconnect',
    version='0.1',
    packages=['wearconnect', 'wearscript'],
    package_dir={'wearscript': 'submodule/wearscript-python'}
    author='Scott Greenwald',
    author_email='scottgwald@gmail.com',
    license='Apache 2.0',
    description='wear connect server and test scripts',
    long_description=open('README.md').read(),
    install_requires=[
        'bottle',
        'Pillow',
        'twisted',
        'redis',
        'apscheduler',
        'wearscript'
    ]
)
