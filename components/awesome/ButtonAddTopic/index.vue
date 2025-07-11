<template>
  <div>
    <button
      class="flex items-center justify-center bg-teal-300 rounded-md p-2 shadow-sm text-teal-900 gap-2"
      @click="isOpen = true"
    >
      <Icon name="mdi:plus" class="w-8 h-8 inline-block" />
      <span class="font-semibold">Add Topic</span>
    </button>

    <TransitionRoot appear :show="isOpen" as="template">
      <Dialog
        as="div"
        class="relative z-50"
        :open="isOpen"
        @close="isOpen = false"
      >
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div
            class="flex min-h-full items-center justify-center p-4 text-center"
          >
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel
                class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
              >
                <DialogTitle
                  as="h3"
                  class="text-lg font-medium leading-6 text-gray-900"
                >
                  Add New Topic
                </DialogTitle>
                <div class="mt-2">
                  <input
                    v-model="topicName"
                    type="text"
                    placeholder="Topic name"
                    class="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <p v-if="error" class="text-red-500 text-sm mt-1">
                  ❌ Failed to add topic.
                </p>

                <div class="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    @click="isOpen = false"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
                    :disabled="pending || !topicName"
                    @click="submit"
                  >
                    <span v-if="pending">Adding...</span>
                    <span v-else>Add</span>
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from '@headlessui/vue'
import { useTopic } from '~/composables/vocab/use-topic'
const emit = defineEmits(['created'])
const isOpen = ref(false)
const topicName = ref('')

const { create } = useTopic()
const error = ref()
const pending = ref(null)

const submit = async () => {
  const { data, error: err, execute } = create(topicName.value)
  await execute()

  if (!err.value) {
    topicName.value = ''
    isOpen.value = false
    emit('created')
  } else {
    console.error('Failed to create:', err.value)
  }
}
</script>
