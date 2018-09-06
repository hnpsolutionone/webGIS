<?php
$host         = "localhost";
$username     = "postgres";
$password     = "root";
$dbname       = "postgis_24_sample";
$result = 0;

/* Create connection */
$conn = pg_connect("host=$host dbname=$dbname user=$username password=$password");
/* Check connection */
if (!$conn) {
     die("Connection to database failed: " . $conn->connect_error);
}
$sql = "select s.* from \"school\" s left join \"fr-laposte_hexasmal\" lh on s.code_postal_uai = lh.code_postal and lh.nom_commune = s.localite_acheminement_uai where lh.code_commune_insee = '" . $_GET['insee_com'] . "'";
$result = pg_query($conn, $sql);
$resultArray = pg_fetch_all($result);
echo json_encode($resultArray);
?>
