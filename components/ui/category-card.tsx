import { createImage } from '@gluestack-ui/core/image/creator';
import { createPressable } from '@gluestack-ui/core/pressable/creator';
import { forwardRef, type ComponentRef } from 'react';
import {
	Image,
	Pressable,
	Text,
	View,
	type ImageProps,
	type PressableProps,
	type TextProps,
	type ViewProps,
} from 'react-native';

type WithClassName<P> = P & {
	className?: string;
};

const StyledCategoryCardRoot = forwardRef<
	ComponentRef<typeof Pressable>,
	WithClassName<PressableProps>
>(({ className = '', style, ...props }, ref) => (
	<Pressable
		ref={ref}
		className={`bg-white rounded-lg shadow-sm elevation-2 ${className}`}
		style={style}
		{...props}
	/>
));
StyledCategoryCardRoot.displayName = 'StyledCategoryCardRoot';

const StyledCategoryCardImage = forwardRef<ComponentRef<typeof Image>, WithClassName<ImageProps>>(
	({ className = '', style, ...props }, ref) => (
		<Image
			ref={ref}
			className={`w-full aspect-square rounded-t-lg ${className}`}
			style={style}
			resizeMode='cover'
			{...props}
		/>
	),
);
StyledCategoryCardImage.displayName = 'StyledCategoryCardImage';

const StyledCategoryCardContent = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View
			ref={ref}
			className={`px-3 py-2 flex-row justify-between items-center ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCategoryCardContent.displayName = 'StyledCategoryCardContent';

const StyledCategoryCardName = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-lg font-bold flex-1 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCategoryCardName.displayName = 'StyledCategoryCardName';

const StyledCategoryCardCount = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--text-dark)] text-lg font-semibold ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCategoryCardCount.displayName = 'StyledCategoryCardCount';

const GluestackCategoryCard = createPressable({
	Root: StyledCategoryCardRoot,
});

const GluestackCategoryCardImage = createImage({
	Root: StyledCategoryCardImage,
});

type CategoryCardProps = PressableProps & {
	imageSource: ImageProps['source'];
	name: string;
	count: string | number;
	className?: string;
	imageClassName?: string;
	contentClassName?: string;
	nameClassName?: string;
	countClassName?: string;
};

export function CategoryCard({
	imageSource,
	name,
	count,
	className = '',
	imageClassName = '',
	contentClassName = '',
	nameClassName = '',
	countClassName = '',
	...rest
}: CategoryCardProps) {
	return (
		<GluestackCategoryCard className={className} {...rest}>
			<GluestackCategoryCardImage source={imageSource} className={imageClassName} />
			<StyledCategoryCardContent className={contentClassName}>
				<StyledCategoryCardName className={nameClassName}>{name}</StyledCategoryCardName>
				<StyledCategoryCardCount className={countClassName}>
					{count}
				</StyledCategoryCardCount>
			</StyledCategoryCardContent>
		</GluestackCategoryCard>
	);
}
