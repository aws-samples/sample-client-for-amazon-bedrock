cmake_minimum_required(VERSION 3.1)
project(aws-crt-nodejs C)
option(BUILD_DEPS "Builds aws common runtime dependencies as part of build, only do this if you don't want to control your dependency chain." ON)

option(CMAKE_JS_PLATFORM "Target platform. Should match node's os.platform()")
if (NOT CMAKE_JS_PLATFORM)
    message(FATAL_ERROR "CMAKE_JS_PLATFORM must be set")
endif()

include(CTest)

# ensure that the release build has symbols
if (NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE RelWithDebInfo)
endif()

if (UNIX AND NOT APPLE)
    include(GNUInstallDirs)
elseif(NOT DEFINED CMAKE_INSTALL_LIBDIR)
    set(CMAKE_INSTALL_LIBDIR "lib")
endif()

if (${CMAKE_INSTALL_LIBDIR} STREQUAL "lib64")
    set(FIND_LIBRARY_USE_LIB64_PATHS true)
endif()

# This is required in order to append /lib/cmake to each element in CMAKE_PREFIX_PATH
set(AWS_MODULE_DIR "/${CMAKE_INSTALL_LIBDIR}/cmake")
string(REPLACE ";" "${AWS_MODULE_DIR};" AWS_MODULE_PATH "${CMAKE_PREFIX_PATH}${AWS_MODULE_DIR}")
# Append that generated list to the module search path
list(APPEND CMAKE_MODULE_PATH ${AWS_MODULE_PATH})

set(CMAKE_INSTALL_PREFIX "${CMAKE_CURRENT_SOURCE_DIR}/dist")

if (BUILD_DEPS)
    message(STATUS "Using submodule dependencies")
    list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_LIST_DIR}/crt/aws-c-common/cmake")
    include(AwsFindPackage)

    set(IN_SOURCE_BUILD ON)
    set(BUILD_TESTING_PREV ${BUILD_TESTING})
    set(BUILD_TESTING OFF)

    add_subdirectory(crt/aws-c-common)
    if (UNIX AND NOT APPLE)
        set(SEARCH_LIBCRYPTO OFF)
        set(DISABLE_GO ON)
        set(DISABLE_PERL ON)
        set(BUILD_LIBSSL OFF)
        add_subdirectory(crt/aws-lc)
        set(UNSAFE_TREAT_WARNINGS_AS_ERRORS OFF)
        add_subdirectory(crt/s2n)
    endif()

    add_subdirectory(crt/aws-c-sdkutils)
    add_subdirectory(crt/aws-c-io)
    add_subdirectory(crt/aws-c-cal)
    add_subdirectory(crt/aws-c-compression)
    add_subdirectory(crt/aws-c-event-stream)
    add_subdirectory(crt/aws-c-http)
    add_subdirectory(crt/aws-c-auth)
    add_subdirectory(crt/aws-c-mqtt)
    add_subdirectory(crt/aws-checksums)

    set(BUILD_TESTING ${BUILD_TESTING_PREV})
else()
    include(AwsFindPackage)
    set(IN_SOURCE_BUILD OFF)
endif()

if (POLICY CMP0069)
    cmake_policy(SET CMP0069 NEW) # Enable LTO/IPO if available in the compiler, see AwsCFlags
endif()

list(APPEND CMAKE_MODULE_PATH "${CMAKE_PREFIX_PATH}/${CMAKE_INSTALL_LIBDIR}/cmake")

include(AwsCFlags)
include(AwsSharedLibSetup)
include(AwsSanitizers)
include(AwsCRuntime)

aws_determine_local_c_runtime(AWS_C_RUNTIME)

file(GLOB AWS_CRT_SRC
       "source/*.c"
)


if(MSVC)
    file(GLOB AWS_WINDOWS_SRC
        "source/windows/*.c"
    )
    message(STATUS "It's MSVC, enable win_delay_load_hook on windows")
    add_library(${PROJECT_NAME} SHARED ${AWS_CRT_SRC} ${AWS_WINDOWS_SRC})
else()
    add_library(${PROJECT_NAME} SHARED ${AWS_CRT_SRC})
endif()

aws_set_common_properties(${PROJECT_NAME})
aws_prepare_symbol_visibility_args(${PROJECT_NAME} "AWS_CRT_NODEJS")
aws_add_sanitizers(${PROJECT_NAME})
aws_split_debug_info(${PROJECT_NAME})

# Gives our library file a .node extension without any "lib" prefix
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

target_include_directories(${PROJECT_NAME} PRIVATE
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>
        ${CMAKE_JS_INC})

aws_use_package(aws-c-http REQUIRED)
aws_use_package(aws-c-mqtt REQUIRED)
aws_use_package(aws-c-auth REQUIRED)
aws_use_package(aws-checksums REQUIRED)
aws_use_package(aws-c-event-stream REQUIRED)
target_link_libraries(${PROJECT_NAME} PRIVATE ${CMAKE_JS_LIB} ${DEP_AWS_LIBS})

set(destination bin/${CMAKE_JS_PLATFORM}-${NODE_ARCH}-${AWS_C_RUNTIME})
install(FILES "${CMAKE_CURRENT_BINARY_DIR}/${CMAKE_BUILD_TYPE}/aws-crt-nodejs.node"
    DESTINATION ${destination})
