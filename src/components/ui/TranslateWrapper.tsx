

type TranslateWrapperProps = {
  text: string;
  dbTranslation?: string | null;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
};

export function TranslateWrapper({
  text,
  dbTranslation,
  as: Tag = 'span',
  className,
}: TranslateWrapperProps) {
  const content =
    dbTranslation && dbTranslation.trim().length > 0 ? dbTranslation : text;
  return <Tag className={className}>{content}</Tag>;
}

