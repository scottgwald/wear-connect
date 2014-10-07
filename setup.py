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

def install_submodules():
    if path.exists('.git'):
        check_call(['pip', 'install', '-e', 'submodule/wearscript-python'])

class build_with_submodules(build):
    def run(self):
        get_submodules()
        build.run(self)
        install_submodules()

class develop_with_submodules(develop):
    def run(self):
        get_submodules()
        develop.run(self)
        install_submodules()

setup(
    name='wearconnect',
    version='0.1',
    packages=['wearconnect'],
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
