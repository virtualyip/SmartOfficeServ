<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class Assets extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
		Schema::create('assets', function(Blueprint $table)
		{
			$table->increments('id');
			$table->string('asset_id', 32)->unique();
			$table->string('name', 64);
			$table->string('type', 32)->nullable();
			$table->string('company_id', 32);
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
		Schema::drop('assets');
    }
}
