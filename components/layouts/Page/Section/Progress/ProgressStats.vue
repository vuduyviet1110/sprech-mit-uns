<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <Card class="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-2"
      >
        <CardTitle class="text-sm font-medium text-blue-700"
          >Words Learned</CardTitle
        >
        <Icon name="mdi:trending-up" class="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-blue-900">127</div>
        <p class="text-xs text-blue-600 mt-1">+12 this week</p>
      </CardContent>
    </Card>

    <Card
      class="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
    >
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-2"
      >
        <CardTitle class="text-sm font-medium text-orange-700"
          >Current Streak</CardTitle
        >
        <Icon name="mdi:fire" class="h-4 w-4 text-orange-600" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-orange-900">12</div>
        <p class="text-xs text-orange-600 mt-1">days in a row</p>
      </CardContent>
    </Card>

    <!-- Ready to Review -->
    <Card
      class="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
    >
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-2"
      >
        <CardTitle class="text-sm font-medium text-purple-700"
          >Ready to Review</CardTitle
        >
        <Icon name="mdi:clock-outline" class="h-4 w-4 text-purple-600" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-purple-900">23</div>
        <p class="text-xs text-purple-600 mt-1">Next in 2 hours</p>
      </CardContent>
    </Card>

    <!-- Mastered Words -->
    <Card class="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-2"
      >
        <CardTitle class="text-sm font-medium text-green-700"
          >Mastered</CardTitle
        >
        <Icon name="mdi:star" class="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-green-900">89</div>
        <p class="text-xs text-green-600 mt-1">70% mastery rate</p>
      </CardContent>
    </Card>

    <!-- Weekly Goal Progress -->
    <Card class="md:col-span-2 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="text-lg text-gray-900">Weekly Goal</CardTitle>
          <Badge variant="outline" class="border-blue-200 text-blue-700">
            34/50 words
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <div class="flex justify-between text-sm text-gray-600">
            <span>Progress this week</span>
            <span>68%</span>
          </div>
          <Progress :model-value="68" class="h-3 bg-slate-200" />
          <p class="text-xs text-gray-500 mt-2">
            16 words remaining to reach your goal
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Study Time Today -->
    <Card class="md:col-span-2 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="text-lg text-gray-900"
            >Today's Study Time</CardTitle
          >
          <Icon name="mdi:calendar" class="h-5 w-5 text-gray-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div class="text-3xl font-bold text-gray-900 mb-2">
          25 <span class="text-lg text-gray-600">minutes</span>
        </div>
        <p class="text-sm text-gray-600">
          Keep it up! Your daily average is 28 minutes.
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
</script>
