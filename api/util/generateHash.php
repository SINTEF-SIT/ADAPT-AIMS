<?php
include('inc/deliver_response.inc.php');
$opts = "v:deh";
$options = getopt($opts);
/**
 * Created by PhpStorm.
 * User: bjorn magnus
 * Date: 14.12.16
 * Time: 10:21
 */
print("key: \"" . getkey() . "\"\n");
if(array_key_exists('d',$options)){
    print(decrypt($options["v"]));
}else if(array_key_exists('e',$options)){
    print(encrypt($options["v"]));
}else if(array_key_exists('h',$options)){
    print(hashword($options["v"]));
}
?>