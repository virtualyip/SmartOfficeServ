<?php

use Illuminate\Database\Seeder;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('users')->delete();
        DB::table('users')->insert([
        [
            'user_id' => hash('crc32','1'),
            'employee_id' => '',
            'email'    => 'yip@yip.com',
            'password' => Hash::make('12345'),
            'company' => 'ABC Company Ltd.',
            'surname' => 'Chan',
            'nickname' => 'Ken',
            'gender' => 'M',
            'department' => 'IT',
            'title' => 'Programmer',
            'location' => 'Rm409',
            'phone' => 'Ext19',
            'img' => '../img/max.png',
            'map_location' => '{"map":1,"px":0.123,"py":0.531}',
            'devices' => '[1,2,3]',
            'created_at' => date('Y-m-d H:i:s'),
            'api_token' => Hash::make('12345'),
            'enabled' => 1,
        ],[
            'user_id' => hash('crc32','2'),
            'employee_id' => '',
            'email'    => 'smile_eva@ymail.com',
            'password' => Hash::make('12345'),
            'company' => 'ABC Company Ltd.',
            'surname' => 'Eva',
            'nickname' => 'Kong',
            'gender' => 'F',
            'department' => 'CS',
            'title' => 'Supervious',
            'location' => 'Rm408',
            'phone' => 'Ext18',
            'img' => '../img/ben.png',
            'map_location' => '{"map":1,"px":0.323,"py":0.331}',
            'devices' => '[1,2]',
            'created_at' => date('Y-m-d H:i:s'),
            'api_token' => Hash::make('12345'),
            'enabled' => 1,
        ],[
            'user_id' => hash('crc32','3'),
            'employee_id' => '',
            'email'    => 'u3526890@connect.hku.hk',
            'password' => Hash::make('12345'),
            'company' => 'ABC Company Ltd.',
            'surname' => 'Sam',
            'nickname' => 'Wong',
            'gender' => 'M',
            'department' => 'Admin',
            'title' => 'Clerk',
            'location' => 'Rm418',
            'phone' => 'Ext28',
            'img' => '../img/adam.png',
            'map_location' => '{"map":1,"px":0.623,"py":0.931}',
            'devices' => '[2,3]',
            'created_at' => date('Y-m-d H:i:s'),
            'api_token' => Hash::make('12345'),
            'enabled' => 1,
        ]
        ]);
    }
}
