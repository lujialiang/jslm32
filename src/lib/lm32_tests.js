/**
 *
 * Test Runner
 *
 * Copyright (c) 2011-2012, 2016-2017 Reginaldo Silva (reginaldo@ubercomp.com)
 *
 *
 * This Javascript code is free software; you can redistribute it
 * and/or modify it under the terms of the GNU Lesser General Public
 * License, version 2.1, as published by the Free Software Foundation.
 *
 * This code is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this code; if not, see
 * <http://www.gnu.org/licenses/lgpl-2.1.html>
 */
 (function() {
"use strict";

function run_tests(cpu_f, wait_time, first_test, last_test) {
    if (! wait_time) {
        wait_time = 500;
    }
    var term_element = 'terminal';
    var tests = [
        'test_add.tst.bin',
        'test_addi.tst.bin',
        'test_and.tst.bin',
        'test_andhi.tst.bin',
        'test_andi.tst.bin',
        'test_b.tst.bin',
        'test_be.tst.bin',
        'test_bg.tst.bin',
        'test_bge.tst.bin',
        'test_bgeu.tst.bin',
        'test_bgu.tst.bin',
        'test_bi.tst.bin',
        'test_bne.tst.bin',
        'test_break.tst.bin',
        'test_bret.tst.bin',
        'test_call.tst.bin',
        'test_calli.tst.bin',
        'test_cmpe.tst.bin',
        'test_cmpei.tst.bin',
        'test_cmpg.tst.bin',
        'test_cmpge.tst.bin',
        'test_cmpgei.tst.bin',
        'test_cmpgeu.tst.bin',
        'test_cmpgeui.tst.bin',
        'test_cmpgi.tst.bin',
        'test_cmpgu.tst.bin',
        'test_cmpgui.tst.bin',
        'test_cmpne.tst.bin',
        'test_cmpnei.tst.bin',
        'test_divu.tst.bin',
        'test_eret.tst.bin',
        'test_lb.tst.bin',
        'test_lbu.tst.bin',
        'test_lh.tst.bin',
        'test_lhu.tst.bin',
        'test_lw.tst.bin',
        'test_modu.tst.bin',
        'test_mul.tst.bin',
        'test_muli.tst.bin',
        'test_nor.tst.bin',
        'test_nori.tst.bin',
        'test_or.tst.bin',
        'test_orhi.tst.bin',
        'test_ori.tst.bin',
        'test_ret.tst.bin',
        'test_sb.tst.bin',
        'test_scall.tst.bin',
        'test_sextb.tst.bin',
        'test_sexth.tst.bin',
        'test_sh.tst.bin',
        'test_sl.tst.bin',
        'test_sli.tst.bin',
        'test_sr.tst.bin',
        'test_sri.tst.bin',
        'test_sru.tst.bin',
        'test_srui.tst.bin',
        'test_sub.tst.bin',
        'test_sw.tst.bin',
        'test_xnor.tst.bin',
        'test_xnori.tst.bin',
        'test_xor.tst.bin',
        'test_xori.tst.bin'
    ];
    if (first_test === undefined) {
        first_test = 0;
    }
    if (last_test === undefined) {
        last_test = tests.length - 1;
    }
    console.log("Running tests " + first_test + " through " + last_test);
    var sys = start_test_sys(term_element);
    var i = first_test;
    var f = function() {
        sys.shutdown.value = false;
        sys.run_test(tests[i], i, cpu_f, sys.shutdown);
        i++;
        if (i <= last_test) {
            setTimeout(f, wait_time);
        }
    }
    f();
};

function start_test_sys(terminal_div) {
    var RAM_BASE = 0x08000000;
    var RAM_SIZE = 1*1024*1024;
    var EBA_BASE = 0;
    var DEBA_BASE = 0;

    var TESTDEV_BASE = 0xffff0000;
    var MAX_STEPS = 200;
    var BOOT_PC = RAM_BASE;

    var bus = lm32.bus();

    var ram = lm32.ram(RAM_SIZE, true);

    var cpu_params = {
        bus: bus,
        ram: ram,
        ram_base: RAM_BASE,
        ram_size: RAM_SIZE,
        bootstrap_pc: BOOT_PC,
        bootstrap_eba: EBA_BASE,
        bootstrap_deba: DEBA_BASE
    };

    var term = document.getElementById(terminal_div);
    var terminal = (function() {
        return {
          write: function(str) {
              term.textContent = term.textContent + str;
          }
        };
    })();

    terminal.write("LM32 Test Runner\n");

    var shutdown = { value: false };
    function shutdown_f() {
        terminal.write("Shutdown Requested!\n\n");
        shutdown.value = true;
    }

    var testdev_params = {
        bus: bus,
        shutdown: shutdown_f,
        terminal: terminal
    };
    var testdev = lm32.test_dev(testdev_params);
    var dummyTimer = function() {
        return {
            on_tick: function() {}
        }
    };
    var timer = dummyTimer();

    bus.add_memory(RAM_BASE, RAM_SIZE, ram.get_mmio_handlers());
    bus.add_memory(
        TESTDEV_BASE,
        testdev.iomem_size,
        testdev.get_mmio_handlers()
    );

    function run_test(test_name, idx, cpu_f, shutdown) {
        var cpu = cpu_f(cpu_params);
        cpu.set_timers([timer]);
        // testdev.reset();
        var str = "\nRunning Test " + test_name + " (" + idx + ")\n";
        terminal.write(str);
        console.log(str);
        bus.log = false;
        var on_load_binary_result = function(result) {
            bus.log = true;
            var steps = 0;
            while (shutdown.value === false && steps < MAX_STEPS) {
                cpu.step(1);
                steps++;
            }
            if (shutdown.value === false) {
                terminal.write("Shutdown was never requested. Test FAILED\n");
            }

        }
        bus.load_binary("../test/" + test_name, BOOT_PC,on_load_binary_result);
    }

    return {
        run_test: run_test,
        shutdown: shutdown
    };
};

function start_tests_interp(_event) {
    run_tests(lm32.cpu_interp, 0);
}

function start_tests_dynrec(_event) {
    run_tests(lm32.cpu_dynrec, 0);
}

function main() {
    var div = document.getElementById('lm32_tests_container');

    var button_interp = document.createElement('button');
    button_interp.textContent = 'Test Interpreter';
    button_interp.onclick = start_tests_interp;

    var button_dynrec = document.createElement('button');
    button_dynrec.textContent = 'Test Dynrec';
    button_dynrec.onclick = start_tests_dynrec;


    var terminal = document.createElement('pre');
    terminal.id = 'terminal';
    div.appendChild(button_interp);
    div.appendChild(button_dynrec);
    div.appendChild(terminal);
}

document.addEventListener("DOMContentLoaded", function(_event) { main(); });
})();
