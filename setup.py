#!/usr/bin/env python
from distutils.core import setup

setup(
    name='wearconnect',
    version='0.1',
    packages=['.'],
    author='Scott Greenwald',
    author_email='scottgwald@gmail.com',
    license='Apache 2.0',
    description='wear connect server and test scripts',
    long_description=open('README.md').read(),
    dependency_links=[
        'git+https://github.com/scottgwald/wearscript-python.git@5984a00bddbbbfa7c8b62a9b70571632d0a48e41#egg=wearscript'
    ],
    install_requires=[
        'bottle',
        'Pillow',
        'twisted',
        'redis',
        'apscheduler'
    ]
)
