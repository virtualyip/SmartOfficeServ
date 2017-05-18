<?php

use Illuminate\Database\Seeder;

class CompaniesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('companies')->delete();
        DB::table('companies')->insert([
        [
            'company_id' => 'aaa',
            'company'    => 'ABC Company Ltd.',
            'phone' => '21334322',
            'map_imgs' => '[{"img":"maps/3ffc6aaffa36e23cc917571c224b6e84.png","users":[{"id":"6c300461","px":0.12,"py":0.78},{"id":"020b8668","px":0.42,"py":0.48}],"devices":[{"id":"6c300461","px":0.32,"py":0.58}]}]',
            'map_markers' => '[]'
        ]
        ]);
    }
}