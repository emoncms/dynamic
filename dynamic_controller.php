<?php
/*

All Emoncms code is released under the GNU Affero General Public License.
See COPYRIGHT.txt and LICENSE.txt.

---------------------------------------------------------------------
Emoncms - open source energy visualisation
Part of the OpenEnergyMonitor project:
http://openenergymonitor.org

*/
// no direct access
defined('EMONCMS_EXEC') or die('Restricted access');

function dynamic_controller()
{
    global $route;
    if ($route->format == 'html') {
        if ($route->action=='heatpump') return view("Modules/dynamic/heatpump_view.php",array());
        if ($route->action=='heating') return view("Modules/dynamic/direct_view.php",array());
        if ($route->action=='') return view("Modules/dynamic/dynamic_view.php",array());
    }
    return false;
}
