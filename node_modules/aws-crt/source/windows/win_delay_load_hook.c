/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */

/*
 * This file sets up a windows delay load hook that the dll would redirect to
 * the calling process (.exe file) instead of `node.exe`.
 *
 * This allows compiled addons to work when node.exe is renamed.
 */

/// This file is modifed from https://github.com/nodejs/node-gyp/blob/main/src/win_delay_load_hook.cc
/// under the following license: https://github.com/nodejs/node-gyp?tab=MIT-1-ov-file#readme
/*
** (The MIT License)

** Copyright (c) 2012 Nathan Rajlich <nathan@tootallnate.net>
** Permission is hereby granted, free of charge, to any person
** obtaining a copy of this software and associated documentation
** files (the "Software"), to deal in the Software without
** restriction, including without limitation the rights to use,
** copy, modify, merge, publish, distribute, sublicense, and/or sell
** copies of the Software, and to permit persons to whom the
** Software is furnished to do so, subject to the following
** conditions:

** The above copyright notice and this permission notice shall be
** included in all copies or substantial portions of the Software.

** THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
** OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
** NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
** HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
** WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
** FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
** OTHER DEALINGS IN THE SOFTWARE.
*/

#ifdef _MSC_VER

#    ifndef WIN32_LEAN_AND_MEAN
#        define WIN32_LEAN_AND_MEAN
#    endif
#    include <windows.h>

/* 2024/01/30 Modified by Amazon - Begin */
/* keep the space to prevent formatters from reordering this with the Windows.h header. */
/* Temporary disable the warning 4201 for nameless struct/union. delayimp.h uses nameless struct. */
#    pragma warning(push)
#    pragma warning(disable : 4201)
#    include <delayimp.h>
#    pragma warning(pop)
#    include <ctype.h>

#    define NODE_EXECUTABLE "node.exe"
#    define LENGTH_OF_NODE_EXECUTABLE 8
/* 2024/01/30 Modified by Amazon - End */

FARPROC WINAPI load_exe_hook(unsigned dliNotify, PDelayLoadInfo pdli) {

    /*
     * 2024/01/30 Modified by Amazon - Begin
     * The function is modifed based on microsoft sample hook function
     * https://learn.microsoft.com/en-us/cpp/build/reference/understanding-the-helper-function?view=msvc-170#sample-hook-function
     */
    switch (dliNotify) {
        case dliNotePreLoadLibrary:

            // If you want to return control to the helper, return 0.
            // Otherwise, return your own HMODULE to be used by the
            // helper instead of having it call LoadLibrary itself.
            if (_strnicmp(pdli->szDll, NODE_EXECUTABLE, LENGTH_OF_NODE_EXECUTABLE) != 0) {
                // return control if we are not loading node.exe
                return NULL;
            }

            // As in Electron 4.x and higher, the symbols needed by native modules are exported by `electron.exe`
            // instead of `node.exe`. It is necessary to overwrite the node load process. More info about Electron
            // windows delay load issue:
            //     https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules#a-note-about-win_delay_load_hook

            // If we call GetModuleHandle with NULL, GetModuleHandle returns a handle to the file used to create the
            // calling process (.exe file). This means if we launch the library through `node.exe`, GetModuleHandle
            // would still return `node.exe`. While in the case of electron, instead of loading `node`, GetModuleHandle
            // would return `electron.exe`.
            // This would also solve the issue where the node.exe is rename.
            return (FARPROC)GetModuleHandle(NULL);

        // Return control in the other cases.
        case dliStartProcessing:
        case dliNotePreGetProcAddress:
        case dliFailLoadLib:
        case dliFailGetProc:
        case dliNoteEndProcessing:
        default:
            return NULL;
    }
    /* 2024/01/30 Modified by Amazon - End */
}

ExternC const PfnDliHook __pfnDliNotifyHook2 = load_exe_hook;

#endif
