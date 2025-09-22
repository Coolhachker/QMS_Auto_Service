require 'json'
require 'fluent/plugin/formatter'

module Fluent::Plugin
  class PrettyJsonFormatter < Formatter
    Fluent::Plugin.register_formatter('pretty_json', self)

    def configure(conf)
      super
      # Получаем уровень из конфигурации или используем по умолчанию
      @default_level = conf['default_level'] || 'info'
    end

    def format(tag, time, record)
      # Добавляем поле level если его нет
      record['level'] ||= extract_level_from_tag(tag) || @default_level
      
      # Форматируем в красивый JSON
      JSON.pretty_generate(record) + "\n"
    end

    private

    def extract_level_from_tag(tag)
      # Пытаемся извлечь уровень из тега (например: web.info, rabbitmq.error)
      if tag.include?('.')
        parts = tag.split('.')
        last_part = parts.last.downcase
        # Проверяем, является ли последняя часть валидным уровнем
        if ['debug', 'info', 'warn', 'warning', 'error', 'critical', 'fatal'].include?(last_part)
          return last_part
        end
      end
      nil
    end
  end
end