<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class MapMarkers extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
		Schema::create('map_markers', function(Blueprint $table)
		{
			$table->increments('id');
			$table->string('map_id', 32);
			$table->string('type', 32);
			$table->string('type_id', 32);
			$table->json('type_for', 32)->nullable();
			$table->float('px', 8, 4);
			$table->float('py', 8, 4);
			$table->string('remarks', 255);
			$table->timestamp('created_at')->nullable();
			$table->string('created_by', 128)->nullable();
			$table->timestamp('updated_at')->nullable();
			$table->string('updated_by', 128)->nullable();
		});
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
		Schema::drop('map_markers');
    }
}
