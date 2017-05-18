<?php

use Illuminate\Database\Seeder;

class NotificationTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('notification')->delete();
        DB::table('notification')->insert([
        [
            'from' => 'yip@yip.com',
            'deliver_to'    => '["yip@yip.com"]',
            'notification' => '1. hi how are you?',
            'type' => 'chat',
            'created_at' => date('Y-m-d H:i:s')
        ],[
            'from' => 'yip@yip.com',
            'deliver_to'    => '["yip@yip.com"]',
            'notification' => '2. ASdjjw feajfa ewoirew jewojuweqr',
            'type' => 'email',
            'created_at' => date('Y-m-d H:i:s')
        ],[
            'from' => 'yip@yip.com',
            'deliver_to'    => '["yip@yip.com","smile_eva@ymail.com"]',
            'notification' => '3. ASdjjw feajfa ewoirew jewojuweqr',
            'type' => 'task',
            'created_at' => date('Y-m-d H:i:s')
        ],[
            'from' => 'smile_eva@ymail.com',
            'deliver_to'    => '["yip@yip.com","smile_eva@ymail.com"]',
            'notification' => '4. ASdjjw feajfa ewoirew jewojuweqr',
            'type' => 'chat',
            'created_at' => date('Y-m-d H:i:s')
        ],[
            'from' => 'smile_eva@ymail.com',
            'deliver_to'    => '["smile_eva@ymail.com"]',
            'notification' => '5. ASdjjw feajfa ewoirew jewojuweqr',
            'type' => 'email',
            'created_at' => date('Y-m-d H:i:s')
        ],[
            'from' => 'smile_eva@ymail.com',
            'deliver_to'    => '["smile_eva@ymail.com"]',
            'notification' => '6. ASdjjw feajfa ewoirew jewojuweqr',
            'type' => 'task',
            'created_at' => date('Y-m-d H:i:s')
        ]
        ]);
    }
}