<?php defined('BASEPATH') OR exit('No direct script access allowed');

class Apkparser {
	
    function __construct(){}
    
	function getPackage($filepath) {		
        $CI =& get_instance();
        putenv("PATH=" .getenv("PATH"). ':'.$CI->config->item('android_sdk')."build-tools/23.0.2");
        $package_name = exec("aapt d badging " . getcwd().$filepath . " | grep package");
		preg_match("/ name='([a-z0-9._]*)'/", $package_name, $matches);
        return $matches[1];
	}
	
	function getVersion($filepath) {
        $CI =& get_instance();
        putenv("PATH=" .getenv("PATH"). ':'.$CI->config->item('android_sdk')."build-tools/23.0.2");
		$version = exec("aapt d badging " . getcwd().$filepath . " | grep versionCode");
        preg_match("/versionCode='([0-9]*)'/", $version, $matches);
        return $matches[1];
	}
	
	function getPermissions($filepath) {
        $CI =& get_instance();
        putenv("PATH=" .getenv("PATH"). ':'.$CI->config->item('android_sdk')."build-tools/23.0.2");
        exec("aapt dump permissions " . getcwd().$filepath . " | grep uses-permission", $permissions);
        $perms = array();
        if( count($permissions) > 0 ) {
          foreach( $permissions as $perm ) {
              preg_match("/ name='([a-zA-Z0-9_.]*)'/", $perm, $matches);
              $perms[] = $matches[1];
          }
        }
        return $perms;
	}
}