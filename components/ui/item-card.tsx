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

const StyledCardRoot = forwardRef<ComponentRef<typeof Pressable>, WithClassName<PressableProps>>(
	({ className = '', style, ...props }, ref) => (
		<Pressable
			ref={ref}
			className={`bg-white rounded-lg overflow-hidden shadow-sm elevation-2 ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCardRoot.displayName = 'StyledCardRoot';

const StyledCardImage = forwardRef<ComponentRef<typeof Image>, WithClassName<ImageProps>>(
	({ className = '', style, ...props }, ref) => (
		<Image
			ref={ref}
			className={`w-full aspect-square ${className}`}
			style={style}
			resizeMode='cover'
			{...props}
		/>
	),
);
StyledCardImage.displayName = 'StyledCardImage';

const StyledCardContent = forwardRef<View, WithClassName<ViewProps>>(
	({ className = '', style, ...props }, ref) => (
		<View ref={ref} className={`p-3 ${className}`} style={style} {...props} />
	),
);
StyledCardContent.displayName = 'StyledCardContent';

const StyledCardDescription = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--black)] text-sm mb-2 ${className}`}
			style={style}
			numberOfLines={2}
			{...props}
		/>
	),
);
StyledCardDescription.displayName = 'StyledCardDescription';

const StyledCardPrice = forwardRef<Text, WithClassName<TextProps>>(
	({ className = '', style, ...props }, ref) => (
		<Text
			ref={ref}
			className={`text-[color:var(--black)] text-base font-semibold ${className}`}
			style={style}
			{...props}
		/>
	),
);
StyledCardPrice.displayName = 'StyledCardPrice';

const GluestackCard = createPressable({
	Root: StyledCardRoot,
});

const GluestackCardImage = createImage({
	Root: StyledCardImage,
});

type ItemCardProps = PressableProps & {
	imageSource: ImageProps['source'];
	description: string;
	price: string;
	className?: string;
	imageClassName?: string;
	contentClassName?: string;
	descriptionClassName?: string;
	priceClassName?: string;
};

export function ItemCard({
	imageSource,
	description,
	price,
	className = '',
	imageClassName = '',
	contentClassName = '',
	descriptionClassName = '',
	priceClassName = '',
	...rest
}: ItemCardProps) {
	return (
		<GluestackCard className={className} {...rest}>
			<GluestackCardImage source={imageSource} className={imageClassName} />
			<StyledCardContent className={contentClassName}>
				<StyledCardDescription className={descriptionClassName}>
					{description}
				</StyledCardDescription>
				<StyledCardPrice className={priceClassName}>{price}</StyledCardPrice>
			</StyledCardContent>
		</GluestackCard>
	);
}
