#!/usr/bin/env python
from os import path
from distutils.core import setup
from subprocess import check_call
from distutils.command.build import build
from setuptools.command.develop import develop

def get_submodules():
    if path.exists('.git'):
        check_call(['rm', '-rf', 'submodule/wearscript-python'])
        check_call(['git', 'reset', '--hard'])
        check_call(['git', 'submodule', 'init'])
        check_call(['git', 'submodule', 'update'])


class build_with_submodules(build):
    def run(self):
        get_submodules()
        build.run(self)


class develop_with_submodules(develop):
    def run(self):
        get_submodules()
        develop.run(self)


setup(
    name='wearconnect',
    version='0.1',
    packages=['wearconnect', 'wearscript'],
    package_dir={'wearscript': 'submodule/wearscript-python'},
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
        'apscheduler'
    ],
    cmdclass={"build": build_with_submodules, "develop": develop_with_submodules},
)
