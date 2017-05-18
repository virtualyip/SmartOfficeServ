<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUsersTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('users', function(Blueprint $table)
		{
			$table->increments('id');
			$table->string('user_id', 32)->unique();
			$table->string('email')->unique();
			$table->string('password');
			$table->string('company_id', 32)->nullable();
			$table->string('employee_id', 32)->nullable();
			$table->string('surname', 32)->nullable();
			$table->string('nickname', 32)->nullable();
			$table->string('gender', 10)->nullable();
			$table->string('department', 32)->nullable();
			$table->string('title', 32)->nullable();
			$table->string('location', 32)->nullable();
			$table->string('phone', 32)->nullable();
			$table->string('img')->nullable();
			$table->timestamp('last_login')->nullable();
			$table->timestamp('last_active')->nullable();
			$table->timestamp('last_read')->nullable();
			$table->boolean('enabled')->default(false);
			$table->boolean('delete_flag')->default(false);
            $table->string('api_token', 60)->unique();
			$table->rememberToken();
			$table->timestamp('created_at')->nullable();
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
		Schema::drop('users');
	}

}
