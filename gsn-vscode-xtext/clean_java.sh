#!/bin/bash
./gradlew clean
rm -rf edu.vanderbilt.isis.caid.assurancedsl/build
rm -rf edu.vanderbilt.isis.caid.assurancedsl/model
rm -rf edu.vanderbilt.isis.caid.assurancedsl/src/main/xtext-gen
rm -rf edu.vanderbilt.isis.caid.assurancedsl/src/main/xtend-gen
rm -rf edu.vanderbilt.isis.caid.assurancedsl/src/test/xtext-gen
rm -rf edu.vanderbilt.isis.caid.assurancedsl/src/test/xtend-gen

rm -rf edu.vanderbilt.isis.caid.assurancedsl.ide/build
rm -rf edu.vanderbilt.isis.caid.assurancedsl.ide/src/main/xtend-gen
rm -rf edu.vanderbilt.isis.caid.assurancedsl.ide/src/main/xtext-gen

rm -rf edu.vanderbilt.isis.caid.assurancedsl.web/build
rm -rf edu.vanderbilt.isis.caid.assurancedsl.web/src/main/xtext-gen
rm -rf edu.vanderbilt.isis.caid.assurancedsl.web/src/main/xtend-gen